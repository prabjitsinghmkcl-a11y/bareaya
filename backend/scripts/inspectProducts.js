const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'Bareaya' });
    console.log('DB connected');

    const Product = require('../model/Product');
    const products = await Product.find({}).lean();
    console.log('Total products:', products.length);

    const { counts, samples } = products.reduce(
      (acc, p) => {
        const url = p.imageUrl || '';
        let kind = 'EMPTY';
        if (url.startsWith('http')) kind = 'HTTP';
        if (url.startsWith('/uploads')) kind = 'LOCAL_UPLOADS';
        if (url.startsWith('https://res.cloudinary.com')) kind = 'CLOUDINARY';
        if (url.startsWith('data:image')) kind = 'DATA_URL';
        acc.counts[kind] = (acc.counts[kind] || 0) + 1;
        if ((acc.samples[kind] || []).length < 3) {
          if (!acc.samples[kind]) acc.samples[kind] = [];
          acc.samples[kind].push({ id: p._id.toString(), name: p.name, imageUrl: p.imageUrl });
        }
        return acc;
      },
      { counts: {}, samples: {} }
    );

    console.log('URL type counts:', JSON.stringify(counts, null, 2));
    console.log('Samples:', JSON.stringify(samples, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
})();