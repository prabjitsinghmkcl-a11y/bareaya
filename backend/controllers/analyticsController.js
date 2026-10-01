const Order = require('../model/Order');
const Product = require('../model/Product');
const User = require('../model/User');
const { sendErrorResponse } = require('../utils/apiError');

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

// Cancelled orders are excluded from revenue. This was applied to the monthly
// chart but NOT to the headline total, so the two figures on the same dashboard
// disagreed and the last 6 months could never sum to the total.
const REVENUE_STATUSES = ['paid', 'shipped', 'delivered'];
const REVENUE_STATUS_FILTER = { status: { $in: REVENUE_STATUSES } };

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

const getAdminStats = async (req, res) => {
  try {
    // Everything is computed by the database. The previous version pulled the
    // entire orders collection into memory (every address block and item array)
    // just to reduce over totalAmount — an unbounded memory spike that grew
    // with the store and slowed down every dashboard load.
    const [totalOrders, totalProducts, totalUsers, revenueAgg, statusAgg, monthlyAgg, recentOrders, lowStockProducts] =
      await Promise.all([
        Order.countDocuments({}),
        Product.countDocuments({}),
        User.countDocuments({ role: 'user' }),
        Order.aggregate([
          { $match: REVENUE_STATUS_FILTER },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Order.aggregate([
          { $match: REVENUE_STATUS_FILTER },
          {
            $group: {
              _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
              total: { $sum: '$totalAmount' }
            }
          }
        ]),
        Order.find({}).populate('userId', 'name email').sort({ createdAt: -1 }).limit(5),
        Product.find({ stock: { $lte: 10 } }).sort({ stock: 1 }).limit(6)
      ]);

    const totalRevenue = round2(revenueAgg[0] && revenueAgg[0].total);

    const orderStatusCounts = {};
    STATUSES.forEach((s) => { orderStatusCounts[s] = 0; });
    statusAgg.forEach((row) => {
      if (row._id in orderStatusCounts) orderStatusCounts[row._id] = row.count;
    });

    const now = new Date();
    const monthlyRevenue = [];
    const monthKeys = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en', { month: 'short' });
      monthlyRevenue.push({ label, total: 0 });
      monthKeys.push({ year: d.getFullYear(), month: d.getMonth() + 1, label });
    }

    const monthlyTotals = new Map();
    monthlyAgg.forEach((row) => {
      monthlyTotals.set(`${row._id.year}-${row._id.month}`, round2(row.total));
    });
    monthKeys.forEach((key, idx) => {
      monthlyRevenue[idx].total = monthlyTotals.get(`${key.year}-${key.month}`) || 0;
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