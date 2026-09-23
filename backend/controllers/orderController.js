const Order = require('../model/Order');
const sendEmail = require('../utils/sendEmail');
const { sendErrorResponse } = require('../utils/apiError');
const { escapeHtml } = require('../utils/escapeHtml');
const { computeOrderTotals, OrderTotalError } = require('../utils/orderTotals');
const { verifyRazorpaySignature, getRazorpayInstance } = require('./paymentController');
const {
  decrementStock,
  restoreStock,
  syncCustomerName,
  sendConfirmationEmail,
  finalizeRazorpayOrder
} = require('../services/orderWorkflow');

const addOrderItems = async (req, res) => {
  try {
    const { totalAmount, address, orderNotes, paymentId, paymentMethod, razorpayOrderId, razorpaySignature } = req.body;

    if (!address || !address.street || !address.city || !address.postalCode || !address.country) {
      return res.status(400).json({ message: 'Shipping address is incomplete' });
    }

    const method = paymentMethod === 'cod' ? 'cod' : 'razorpay';

    if (method === 'razorpay') {
      // The order intent was already created when the razorpay order was made
      // (POST /api/payment/order). Validate the payment here, then flip the
      // intent to paid — idempotently, so the webhook and the frontend
      // callback can both fire without double-processing.
      if (!paymentId || !razorpayOrderId || !razorpaySignature) {
        return res.status(400).json({ message: 'Payment details are incomplete.' });
      }
      if (!verifyRazorpaySignature(razorpayOrderId, paymentId, razorpaySignature)) {
        return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
      }

      let intent = await Order.findOne({ razorpayOrderId, paymentMethod: 'razorpay', status: 'pending' });

      if (!intent) {
        // Fallback for orders whose intent was never saved (e.g. created a
        // moment before this feature shipped): create it from the request now.
        let settled;
        try {
          settled = await computeOrderTotals(req.body.items);
        } catch (err) {
          if (err instanceof OrderTotalError) {
            return res.status(400).json({ message: err.message });
          }
          throw err;
        }
        intent = await Order.create({
          userId: req.user._id,
          items: settled.items,
          totalAmount: settled.totalAmount,
          address,
          orderNotes: orderNotes || undefined,
          paymentMethod: 'razorpay',
          razorpayOrderId,
          status: 'pending'
        });
      }

      // Confirm the razorpay order exists and matches the stored total.
      let rOrder;
      try {
        rOrder = await getRazorpayInstance().orders.fetch(razorpayOrderId);
      } catch (fetchError) {
        console.error('[Razorpay] orders.fetch failed:', fetchError.message);
      }
      if (!rOrder) {
        return res.status(400).json({ message: 'Payment verification failed. Order not found.' });
      }
      if (rOrder.amount !== Math.round(intent.totalAmount * 100)) {
        return res.status(400).json({ message: 'Payment amount does not match the order total. Please try again.' });
      }

      const submittedTotal = Number(totalAmount);
      if (!Number.isFinite(submittedTotal) || Math.abs(submittedTotal - intent.totalAmount) > 0.01) {
        return res.status(400).json({ message: 'Order total does not match. Please refresh the page and try again.' });
      }

      // A single payment must not be reused to place multiple DIFFERENT
      // orders — but the same payment finalizing its own intent (e.g. the
      // webhook already marked it paid) must not be treated as a duplicate.
      const existingPayment = await Order.findOne({ paymentId });
      if (existingPayment && existingPayment.razorpayOrderId !== razorpayOrderId) {
        return res.status(400).json({ message: 'This payment has already been used for an order.' });
      }

      const result = await finalizeRazorpayOrder({ razorpayOrderId, paymentId });
      if (!result.order) {
        return res.status(400).json({ message: 'Order could not be found for this payment. Please contact support.' });
      }
      return res.status(result.alreadyFinalized ? 200 : 201).json(result.order);
    }

    // ---- Cash on Delivery: create the order directly. ----
    let settled;
    try {
      settled = await computeOrderTotals(req.body.items);
    } catch (err) {
      if (err instanceof OrderTotalError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
    const verifiedTotal = settled.totalAmount;

    const submittedCODTotals = Number(totalAmount);
    if (!Number.isFinite(submittedCODTotals) || Math.abs(submittedCODTotals - verifiedTotal) > 0.01) {
      return res.status(400).json({ message: 'Order total does not match. Please refresh the page and try again.' });
    }

    const codOrder = new Order({
      userId: req.user._id,
      items: settled.items,
      totalAmount: verifiedTotal,
      address,
      orderNotes: orderNotes || '',
      paymentMethod: 'cod',
      status: 'pending'
    });

    // Atomically decrement stock. Any failure restores the quantities that
    // were already deducted so inventory stays consistent.
    const failedItems = await decrementStock(codOrder.items);
    if (failedItems.length > 0) {
      await restoreStock(codOrder.items);
      return res.status(400).json({ message: 'Only limited stock is available for some items in your order.' });
    }

    const createdOrder = await codOrder.save();

    await syncCustomerName(createdOrder);
    await sendConfirmationEmail(createdOrder);

    res.status(201).json(createdOrder);
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

const myorders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id });
    res.json(orders);
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('userId', 'name');
    res.json(orders);
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.status = req.body.status || order.status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own orders' });
    }
    if (!['pending', 'paid'].includes(order.status)) {
      return res.status(400).json({ message: `Order cannot be cancelled once it is ${order.status}` });
    }
    order.status = 'cancelled';
    await order.save();

    try {
      const message = `
        <h2>Order Cancelled</h2>
        <p>Hello ${escapeHtml(req.user.name)},</p>
        <p>Your order <strong>${order._id}</strong> has been cancelled.</p>
        <p>If you made a payment, a refund will be initiated shortly.</p>
        <p>Thank you for shopping with Bareaya!</p>
      `;
      const customerEmail = (order.address && order.address.email) || req.user.email;
      if (customerEmail) {
        sendEmail({
          email: customerEmail,
          subject: 'Bareaya - Order Cancelled',
          html: message
        }).catch((emailError) => console.error('Cancellation email failed:', emailError.message));
      }
    } catch (emailError) {
      console.error('Cancellation email failed:', emailError.message);
    }

    res.json(order);
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

module.exports = { addOrderItems, myorders, getOrders, updateOrderStatus, cancelOrder };