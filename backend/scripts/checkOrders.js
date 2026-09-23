const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'Bareaya' });
    console.log('DB connected');
    const Order = require('../model/Order');
    const orders = await Order.find({}).lean();
    console.log('Total orders:', orders.length);
    for (const o of orders) {
      console.log('-----');
      console.log('orderId:', o._id);
      console.log('items:', JSON.stringify(o.items));
      console.log('address:', JSON.stringify(o.address));
      console.log('paymentMethod:', o.paymentMethod, '| paymentId:', o.paymentId, '| total:', o.totalAmount, '| status:', o.status);
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
})();