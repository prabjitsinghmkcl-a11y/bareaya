const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, default: '' },
    category: { type: String, required: true },
    tag: { type: String, default: '', maxlength: 60 },
    stock: { type: Number, required: true },
  },
  { timestamps: true }
);

// The storefront lists and filters by these; without an index each page load
// is a full collection scan.
productSchema.index({ category: 1 });
productSchema.index({ stock: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;