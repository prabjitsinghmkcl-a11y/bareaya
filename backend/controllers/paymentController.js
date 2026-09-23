const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../model/Order');
const { sendErrorResponse } = require('../utils/apiError');
const { computeOrderTotals, OrderTotalError } = require('../utils/orderTotals');
const { finalizeRazorpayOrder } = require('../services/orderWorkflow');

const getRazorpayInstance = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

const createOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[Razorpay] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured on the server.');
      return res.status(500).json({ message: 'Payment is not configured on the server. Please contact support.' });
    }

    // The amount is computed server-side from the product database. Clients
    // only submit product ids + quantities — never a price or total.
    let verified;
    try {
      verified = await computeOrderTotals(req.body.items);
    } catch (err) {
      if (err instanceof OrderTotalError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }

    const { address, orderNotes } = req.body;
    if (!address || !address.street || !address.city || !address.postalCode || !address.country) {
      return res.status(400).json({ message: 'Shipping address is incomplete' });
    }

    const options = {
      amount: Math.round(verified.totalAmount * 100),
      currency: 'INR',
      notes: { items: verified.items.length }
    };

    let order;
    try {
      order = await getRazorpayInstance().orders.create(options);
    } catch (razorpayError) {
      const code = razorpayError && razorpayError.error && razorpayError.error.code;
      console.error('[Razorpay] order.create failed. code=' + (code || 'n/a'), razorpayError.message);
      throw razorpayError;
    }
    if (!order) return res.status(500).json({ message: 'Some error occurred' });

    // Persist an order "intent" immediately. The Razorpay webhook (or the
    // frontend success callback) flips this from pending -> paid later, so a
    // customer who is charged but whose browser callback fails still gets a
    // recorded, confirmed order.
    try {
      await Order.create({
        userId: req.user._id,
        items: verified.items,
        totalAmount: verified.totalAmount,
        address,
        orderNotes: orderNotes || undefined,
        paymentMethod: 'razorpay',
        razorpayOrderId: order.id,
        status: 'pending'
      });
    } catch (intentError) {
      console.error('[Razorpay] Failed to save order intent:', intentError.message);
    }

    res.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

const verifyRazorpaySignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const expected = crypto
    .createHmac('sha256', String(process.env.RAZORPAY_KEY_SECRET))
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  const provided = String(razorpaySignature || '');
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(provided, 'utf8'));
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ message: 'Invalid signature sent!' });
    }
    return res.status(200).json({ message: 'Payment verified successfully' });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

// Webhook signature is an HMAC-SHA256 of the RAW request body using the
// razorpay key secret. Must be called with req.rawBody (Buffer) available.
const verifyWebhookSignature = (rawBody, signature) => {
  const expected = crypto
    .createHmac('sha256', String(process.env.RAZORPAY_KEY_SECRET))
    .update(String(rawBody))
    .digest('hex');
  const provided = String(signature || '');
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(provided, 'utf8'));
};

// Server-to-server callback from Razorpay. Mounted with express.raw() (see
// index.js) so the raw body is available for signature verification. Marks a
// pending order intent as paid when the payment is captured, guaranteeing the
// order + confirmation email even if the customer's browser callback fails.
const webhookHandler = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature || !verifyWebhookSignature(req.rawBody || '', signature)) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const payload = req.body || {};
    const event = String(payload.event || '');

    const paymentEntity =
      payload.payload && payload.payload.payment && payload.payload.payment.entity;
    const orderEntity = payload.payload && payload.payload.order && payload.payload.order.entity;

    const razorpayOrderId =
      (paymentEntity && (paymentEntity.order_id || paymentEntity.orderId)) ||
      (orderEntity && orderEntity.id);

    const isPaidCapture =
      event === 'payment.captured' || event === 'payment.authorized' || event === 'order.paid';

    if (razorpayOrderId && isPaidCapture) {
      const orderResult = await finalizeRazorpayOrder({
        razorpayOrderId,
        paymentId: paymentEntity && paymentEntity.id
      });
      if (!orderResult.found) {
        console.warn(`[Razorpay] Webhook ${event} for unknown order ${razorpayOrderId}.`);
      }
    } else {
      console.log(`[Razorpay] Webhook event "${event}" ignored.`);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('[Razorpay] Webhook processing failed:', error.message);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

module.exports = { createOrder, verifyPayment, verifyRazorpaySignature, verifyWebhookSignature, webhookHandler, getRazorpayInstance };