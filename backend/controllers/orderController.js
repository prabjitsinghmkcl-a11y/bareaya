const Order = require('../model/Order');
const User = require('../model/User');
const Customer = require('../model/Customer');
const Product = require('../model/Product');
const sendEmail = require('../utils/sendEmail');
const { sendErrorResponse } = require('../utils/apiError');
const { escapeHtml } = require('../utils/escapeHtml');
const { computeOrderTotals, OrderTotalError } = require('../utils/orderTotals');
const { verifyRazorpaySignature, getRazorpayInstance } = require('./paymentController');

const addOrderItems = async (req, res) => {
  try {
    const { totalAmount, address, orderNotes, paymentId, paymentMethod, razorpayOrderId, razorpaySignature } = req.body;

    if (!address || !address.street || !address.city || !address.postalCode || !address.country) {
      return res.status(400).json({ message: 'Shipping address is incomplete' });
    }

    const method = paymentMethod === 'cod' ? 'cod' : 'razorpay';
    const isRazorpay = method === 'razorpay';

    if (isRazorpay) {
      // The order can only be recorded once the payment is fully verified
      // server-side: valid Razorpay signature AND the razorpay order the
      // payment belongs to was created for exactly this amount.
      if (!paymentId || !razorpayOrderId || !razorpaySignature) {
        return res.status(400).json({ message: 'Payment details are incomplete.' });
      }
      if (!verifyRazorpaySignature(razorpayOrderId, paymentId, razorpaySignature)) {
        return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
      }
    }

    // Recompute names, prices and the total from the product database so
    // nothing client-supplied can alter the order value — in parallel with
    // fetching the razorpay order, since both are independent round trips.
    const settled = await Promise.allSettled([
      computeOrderTotals(req.body.items),
      isRazorpay ? getRazorpayInstance().orders.fetch(razorpayOrderId) : Promise.resolve(null)
    ]);

    if (settled[0].status === 'rejected') {
      if (settled[0].reason instanceof OrderTotalError) {
        return res.status(400).json({ message: settled[0].reason.message });
      }
      throw settled[0].reason;
    }
    const { items, totalAmount: verifiedTotal } = settled[0].value;

    if (isRazorpay) {
      if (settled[1].status === 'rejected') {
        return res.status(400).json({ message: 'Payment verification failed. Order not found.' });
      }
      if (settled[1].value.amount !== Math.round(verifiedTotal * 100)) {
        return res.status(400).json({ message: 'Payment amount does not match the order total. Please try again.' });
      }
    }

    const submittedTotal = Number(totalAmount);
    if (!Number.isFinite(submittedTotal) || Math.abs(submittedTotal - verifiedTotal) > 0.01) {
      return res.status(400).json({ message: 'Order total does not match. Please refresh the page and try again.' });
    }

    // A single payment must not be reused to place multiple orders.
    if (paymentId) {
      const existingPayment = await Order.findOne({ paymentId });
      if (existingPayment) {
        return res.status(400).json({ message: 'This payment has already been used for an order.' });
      }
    }

    const order = new Order({
      userId: req.user._id,
      items,
      totalAmount: verifiedTotal,
      address,
      orderNotes: orderNotes || '',
      paymentId: paymentId || undefined,
      paymentMethod: method,
      status: method === 'razorpay' ? 'paid' : 'pending'
    });
    const createdOrder = await order.save();

    // Atomically decrement stock in parallel. Any failure restores the
    // quantities that were already deducted so inventory stays consistent.
    const stockResults = await Promise.all(
      items.map((item) =>
        Product.updateOne(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        )
      )
    );
    const failedItems = items.filter((item, index) => stockResults[index].matchedCount !== 1);
    if (failedItems.length > 0) {
      await Promise.all(
        items.map((item, index) =>
          stockResults[index].matchedCount === 1
            ? Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } })
            : Promise.resolve()
        )
      );
      return res.status(400).json({ message: 'Only limited stock is available for some items in your order.' });
    }

    // Sync the customer's real name from the checkout address so the profile
    // doesn't keep showing the default "Customer" placeholder.
    const fullName = [address.firstName, address.lastName].filter(Boolean).join(' ').trim();
    if (fullName && (!req.user.name || req.user.name === 'Customer')) {
      try {
        await User.updateOne({ _id: req.user._id }, { $set: { name: fullName } });
        if (req.user.phone) {
          await Customer.updateOne({ phone: req.user.phone }, { $set: { name: fullName } });
        }
      } catch (nameError) {
        console.error('Syncing customer name failed:', nameError.message);
      }
    }

    try {
      const customerName = escapeHtml([address.firstName, address.lastName].filter(Boolean).join(' ').trim() || req.user.name || 'Customer');
      const customerEmail = address.email || req.user.email;

      const itemsHtml = createdOrder.items
        .map((item) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(item.name) || 'Product'}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
          </tr>
        `)
        .join('');

      const shipTo = escapeHtml(
        [address.street, address.apartment, address.city, address.state, address.postalCode, address.country]
          .filter(Boolean)
          .join(', ')
      );

      const message = `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#1d1d1d;">Your order is placed successfully!</h2>
          <p>Hello ${customerName},</p>
          <p>Thank you for shopping with Bareaya. Your order has been confirmed.</p>
          <p><strong>Order ID:</strong> ${createdOrder._id}</p>
          <table style="width:100%;border-collapse:collapse;margin:12px 0;">
            <tr>
              <th style="padding:8px;text-align:left;background:#f5f5f5;">Item</th>
              <th style="padding:8px;text-align:center;background:#f5f5f5;">Qty</th>
              <th style="padding:8px;text-align:right;background:#f5f5f5;">Amount</th>
            </tr>
            ${itemsHtml}
            <tr>
              <td colspan="2" style="padding:8px;font-weight:bold;">Total (incl. 18% GST)</td>
              <td style="padding:8px;text-align:right;font-weight:bold;">₹${Number(createdOrder.totalAmount).toFixed(2)}</td>
            </tr>
          </table>
          <p><strong>Payment:</strong> ${createdOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid online (Razorpay)'}</p>
          <p><strong>Deliver to:</strong> ${shipTo}</p>
          <p>We will notify you once your order is shipped. For any questions, reply to this email or contact us at ${process.env.SMTP_FROM || process.env.EMAIL_USER}.</p>
          <p>Thank you,<br/>Bareaya Team</p>
        </div>
      `;

      if (customerEmail) {
        sendEmail({
          email: customerEmail,
          subject: 'Bareaya - Your order has been placed successfully',
          html: message
        }).catch((emailError) => console.error('Order confirmation email failed:', emailError.message));
      }
    } catch (emailError) {
      console.error('Order confirmation email failed:', emailError.message);
    }

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