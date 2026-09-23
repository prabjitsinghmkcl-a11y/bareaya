const Order = require('../model/Order');
const Product = require('../model/Product');
const User = require('../model/User');
const { sendErrorResponse } = require('../utils/apiError');

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const getAdminStats = async (req, res) => {
  try {
    const [totalOrders, totalProducts, totalUsers, orders, recentOrders, lowStockProducts] = await Promise.all([
      Order.countDocuments({}),
      Product.countDocuments({}),
      User.countDocuments({ role: 'user' }),
      Order.find({}),
      Order.find({}).populate('userId', 'name email').sort({ createdAt: -1 }).limit(5),
      Product.find({ stock: { $lte: 10 } }).sort({ stock: 1 }).limit(6)
    ]);

    const totalRevenue = orders.reduce((acc, item) => acc + Number(item.totalAmount || 0), 0);

    const orderStatusCounts = {};
    STATUSES.forEach((s) => { orderStatusCounts[s] = 0; });
    orders.forEach((o) => {
      if (o.status in orderStatusCounts) orderStatusCounts[o.status] += 1;
    });

    const now = new Date();
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      monthlyRevenue.push({
        label: new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleString('en', { month: 'short' }),
        total: 0
      });
    }
    orders.forEach((o) => {
      if (o.status === 'cancelled') return;
      const d = new Date(o.createdAt);
      const idx = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()) + 5;
      if (idx >= 0 && idx < 6) monthlyRevenue[idx].total += Number(o.totalAmount || 0);
    });

    res.json({
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue,
      orderStatusCounts,
      monthlyRevenue,
      recentOrders,
      lowStockProducts
    });
  } catch (error) {
    sendErrorResponse(res, error);
  }
};

module.exports = { getAdminStats };