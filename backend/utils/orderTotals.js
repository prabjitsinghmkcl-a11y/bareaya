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
//
// Duplicate cart lines for the same product are merged into a single line with
// the quantities summed. Without this, a request like
//   items: [{productId: X, quantity: 5}, {productId: X, quantity: 5}]
// would pass the per-line stock check twice against the same stock figure and
// deduct 10 units from a product that only had 7.
const computeOrderTotals = async (rawItems = []) => {
  const requestedByProduct = new Map();
  for (const raw of rawItems) {
    const key = String(raw.productId);
    const quantity = Number.isFinite(Number(raw.quantity))
      ? Math.max(1, Math.floor(Number(raw.quantity)))
      : 1;
    requestedByProduct.set(key, (requestedByProduct.get(key) || 0) + quantity);
  }

  const productIds = [...requestedByProduct.keys()];
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map();
  for (const product of products) productMap.set(String(product._id), product);

  const items = [];
  for (const [key, quantity] of requestedByProduct) {
    const product = productMap.get(key);
    if (!product) {
      throw new OrderTotalError('PRODUCT_NOT_FOUND', 'Some items in your cart are no longer available. Please refresh the page.');
    }
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