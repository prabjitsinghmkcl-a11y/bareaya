const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendErrorResponse } = require('../utils/apiError');
const { computeOrderTotals, OrderTotalError } = require('../utils/orderTotals');

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

module.exports = { createOrder, verifyPayment, verifyRazorpaySignature, getRazorpayInstance };