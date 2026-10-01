const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./model/Product');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'Bareaya' });
  const products = await Product.find({}).sort('name').select('name price size imageUrl').lean();
  products.forEach((p) => console.log(`${p.name}  |  ${p.price}  |  ${p.size || ''}`));
  await mongoose.disconnect();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });