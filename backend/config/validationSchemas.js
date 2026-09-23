const authSendOtp = {
  phone: { type: 'phone', required: true },
  name:  { type: 'string', required: false, minLength: 2, maxLength: 60, pattern: /^[a-zA-Z\s.'-]+$/ },
};

const authVerifyOtp = {
  phone: { type: 'phone', required: true },
  otp:   { type: 'string', required: true, minLength: 6, maxLength: 6, pattern: /^[0-9]{6}$/ },
};

const authLogin = {
  email:    { type: 'email',  required: true, maxLength: 120 },
  password: { type: 'string', required: true, minLength: 1, maxLength: 128 },
};

const productCreate = {
  name:        { type: 'string', required: true,  minLength: 1,  maxLength: 200 },
  description: { type: 'string', required: true,  minLength: 1,  maxLength: 5000 },
  price:       { type: 'number', required: true,  min: 0, max: 10_000_000 },
  category:    { type: 'string', required: true,  minLength: 1,  maxLength: 80 },
  stock:       { type: 'number', required: true,  integer: true, min: 0, max: 1_000_000 },
};

// All optional — partial update semantics.
const productUpdate = {
  name:        { type: 'string', required: false, minLength: 1, maxLength: 200 },
  description: { type: 'string', required: false, minLength: 1, maxLength: 5000 },
  price:       { type: 'number', required: false, min: 0, max: 10_000_000 },
  category:    { type: 'string', required: false, minLength: 1, maxLength: 80 },
  stock:       { type: 'number', required: false, integer: true, min: 0, max: 1_000_000 },
};

const productParamId = {
  id: { type: 'mongoId', required: true },
};

const orderItemSchema = {
  productId: { type: 'mongoId', required: true },
  name:      { type: 'string',  required: true, maxLength: 200 },
  quantity:  { type: 'number',  required: true, integer: true, min: 1, max: 10000 },
  price:     { type: 'number',  required: true, min: 0, max: 10_000_000 },
};

const orderCreate = {
  items:        { type: 'array', required: true, min: 1, max: 50, itemSchema: orderItemSchema },
  totalAmount:  { type: 'number', required: true, min: 1, max: 100_000_000 },
  address: {
    type: 'object', required: true,
    fields: {
      firstName:  { type: 'string', required: true, minLength: 1, maxLength: 100 },
      lastName:   { type: 'string', required: true, minLength: 1, maxLength: 100 },
      phone:      { type: 'string', required: false, minLength: 6, maxLength: 20 },
      email:      { type: 'email',  required: true, maxLength: 120 },
      street:     { type: 'string', required: true, minLength: 3, maxLength: 300 },
      apartment:  { type: 'string', required: false, maxLength: 300 },
      city:       { type: 'string', required: true, minLength: 1, maxLength: 100 },
      state:      { type: 'string', required: false, maxLength: 100 },
      postalCode: { type: 'string', required: true, minLength: 3, maxLength: 20, pattern: /^[0-9A-Za-z\s-]+$/ },
      country:    { type: 'string', required: true, minLength: 2, maxLength: 60 },
    },
  },
  orderNotes:  { type: 'string', required: false, maxLength: 500 },
  paymentId:         { type: 'string', required: false, maxLength: 128 },
  paymentMethod:     { type: 'string', required: false, options: ['razorpay', 'cod'], maxLength: 20 },
  razorpayOrderId:   { type: 'string', required: false, minLength: 10, maxLength: 64 },
  razorpaySignature: { type: 'string', required: false, minLength: 10, maxLength: 256 },
};

const orderParamId = {
  id: { type: 'mongoId', required: true },
};

const orderStatusUpdate = {
  status: { type: 'string', required: true, options: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] },
};

const paymentItemSchema = {
  productId: { type: 'mongoId', required: true },
  quantity:  { type: 'number',  required: true, integer: true, min: 1, max: 10000 },
};

const paymentOrder = {
  items: { type: 'array', required: true, min: 1, max: 50, itemSchema: paymentItemSchema },
};

const paymentVerify = {
  razorpay_order_id:   { type: 'string', required: true, minLength: 10, maxLength: 64 },
  razorpay_payment_id: { type: 'string', required: true, minLength: 10, maxLength: 64 },
  razorpay_signature:  { type: 'string', required: true, minLength: 10, maxLength: 256 },
};

const contactCreate = {
  name:    { type: 'string', required: true, minLength: 2, maxLength: 100 },
  email:   { type: 'email',  required: true, maxLength: 120 },
  message: { type: 'string', required: true, minLength: 5, maxLength: 2000 },
};

module.exports = {
  authSendOtp,
  authVerifyOtp,
  authLogin,
  productCreate,
  productUpdate,
  productParamId,
  orderCreate,
  orderParamId,
  orderStatusUpdate,
  paymentOrder,
  paymentVerify,
  contactCreate,
};