const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../model/Product');

const TAG_BY_NAME = {
  'Aloe activator': 'Hydration',
  'Dry facewash': 'Clarity',
  'Eye revival': 'Clarity',
  'Hair Regrowth Mist': 'Clarity',
  'Hydra blast': 'Hydration',
  'Lip balm': 'Hydration',
  'Night balm': 'Hydration',
  'Skin Tonic': 'Hydration',
  'Spray Sunscreen SPF 50 PA++++': 'Protection',
  'Under arm Deo Rollon': 'Clarity',
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'Bareaya' });

    const names = Object.keys(TAG_BY_NAME);
    const lowered = Object.fromEntries(names.map((n) => [n.trim().toLowerCase(), TAG_BY_NAME[n]]));

    const all = await Product.find({}).select('_id name').lean();
    const updates = [];
    for (const product of all) {
      const tag = lowered[String(product.name).trim().toLowerCase()];
      if (tag) updates.push(Product.updateOne({ _id: product._id }, { $set: { tag } }));
    }
    await Promise.all(updates);

    const missing = names.filter((n) => !all.some((p) => String(p.name).trim().toLowerCase() === n.trim().toLowerCase()));
    console.log(`Updated ${updates.length}/${names.length} products by name.`);
    console.log('Missing:', missing);

    const tagged = await Product.find({ tag: { $in: ['Hydration', 'Clarity', 'Protection'] } })
      .select('name tag')
      .lean();
    console.log('\nUpdated tags:');
    tagged.forEach((p) => console.log(`  ${p.name.padEnd(30)} -> ${p.tag}`));
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();