const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, default: '' },
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;