const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const cloudinary = require('../config/cloudinary');
const Product = require('../model/Product');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

async function uploadFile(filePath, publicId) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'bareaya/products',
    public_id: publicId,
    resource_type: 'auto',
    overwrite: true,
  });
  return result;
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'Bareaya' });
    console.log('DB connected');

    const files = fs.readdirSync(UPLOADS_DIR).filter((f) => fs.statSync(path.join(UPLOADS_DIR, f)).isFile());
    console.log('Total files in uploads:', files.length);

    const products = await Product.find({}).lean();
    const urlMap = {}; // '/uploads/<filename>' -> secure_url

    let ok = 0;
    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file);
      try {
        const res = await uploadFile(filePath, file);
        urlMap['/uploads/' + file] = res.secure_url;
        console.log(`UPLOADED ${file} -> ${res.secure_url}`);
        ok++;
      } catch (err) {
        console.error(`UPLOAD FAILED ${file}: ${err.message}`);
      }
    }
    console.log(`Uploaded: ${ok}/${files.length}`);

    let updatedCount = 0;
    for (const product of products) {
      const key = product.imageUrl;
      const newUrl = urlMap[key];
      if (newUrl && key && key !== newUrl) {
        await Product.updateOne({ _id: product._id }, { $set: { imageUrl: newUrl } });
        updatedCount++;
        console.log(`UPDATED product ${product.name}: ${key} -> ${newUrl}`);
      } else {
        console.log(`SKIPPED product ${product.name}: imageUrl=${product.imageUrl}`);
      }
    }
    console.log('Products updated:', updatedCount);

    await mongoose.disconnect();
    console.log('DONE');
  } catch (err) {
    console.error('FATAL:', err);
    process.exit(1);
  }
})();