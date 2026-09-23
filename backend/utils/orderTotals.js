const Product = require('../model/Product');

class OrderTotalError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'OrderTotalError';
    this.code = code;
  }
}

// Recompute item names/prices and the INR total (incl. 18% GST) from the
// product database. Client-supplied names, prices and totals are never
// trusted — only product ids and quantities are used as input.
const computeOrderTotals = async (rawItems = []) => {
  const productIds = rawItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map();
  for (const product of products) productMap.set(String(product._id), product);

  const items = [];
  for (const raw of rawItems) {
    const product = productMap.get(String(raw.productId));
    if (!product) {
      throw new OrderTotalError('PRODUCT_NOT_FOUND', 'Some items in your cart are no longer available. Please refresh the page.');
    }
    const quantity = Number.isFinite(Number(raw.quantity)) ? Math.max(1, Math.floor(Number(raw.quantity))) : 1;
    if (product.stock < quantity) {
      throw new OrderTotalError('INSUFFICIENT_STOCK', `Only ${product.stock} unit(s) of "${product.name}" are available.`);
    }
    items.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal * 1.18;
  const totalAmount = Math.round(Number(total.toFixed(2)) * 100) / 100;
  return { items, subtotal, totalAmount };
};

module.exports = { computeOrderTotals, OrderTotalError };