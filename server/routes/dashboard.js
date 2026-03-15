const express = require('express');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { auth } = require('../middleware/auth');
const router = express.Router();

// ── Main Dashboard ─────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay   = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear  = new Date(today.getFullYear(), 0, 1);

    const [
      todaySales, monthSales, yearSales,
      totalProducts, lowStockProducts,
      totalCustomers, totalInvoices,
      pendingPayments, recentInvoices, topProducts
    ] = await Promise.all([
      Invoice.aggregate([{ $match: { status: 'Issued', createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
      ]).catch(() => []),
      Invoice.aggregate([{ $match: { status: 'Issued', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
      ]).catch(() => []),
      Invoice.aggregate([{ $match: { status: 'Issued', createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
      ]).catch(() => []),
      Product.countDocuments({ isActive: true }).catch(() => 0),
      Product.countDocuments({ isActive: true, $expr: { $lte: ['$totalStock', '$lowStockThreshold'] } }).catch(() => 0),
      Customer.countDocuments({ isActive: true }).catch(() => 0),
      Invoice.countDocuments({ status: 'Issued' }).catch(() => 0),
      Invoice.aggregate([
        { $match: { status: 'Issued', paymentStatus: { $in: ['Unpaid', 'Partial'] } } },
        { $group: { _id: null, total: { $sum: '$dueAmount' }, count: { $sum: 1 } } }
      ]).catch(() => []),
      Invoice.find({ status: 'Issued' })
        .populate('customer', 'name phone')
        .sort({ createdAt: -1 })
        .limit(8)
        .catch(() => []),
      Invoice.aggregate([
        { $match: { status: 'Issued', createdAt: { $gte: startOfMonth } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', name: { $first: '$items.name' }, sku: { $first: '$items.sku' }, totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.total' } } },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 }
      ]).catch(() => []),
    ]);

    // Monthly revenue (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date();
      const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const end   = new Date(d.getFullYear(), d.getMonth() - i + 1, 0, 23, 59, 59);
      const result = await Invoice.aggregate([
        { $match: { status: 'Issued', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
      ]).catch(() => []);
      monthlyData.push({
        month:   start.toLocaleString('default', { month: 'short' }),
        revenue: result[0]?.total || 0,
        orders:  result[0]?.count || 0
      });
    }

    res.json({
      today:           { revenue: todaySales[0]?.total   || 0, orders: todaySales[0]?.count   || 0 },
      month:           { revenue: monthSales[0]?.total   || 0, orders: monthSales[0]?.count   || 0 },
      year:            { revenue: yearSales[0]?.total    || 0, orders: yearSales[0]?.count    || 0 },
      inventory:       { total: totalProducts, lowStock: lowStockProducts },
      customers:       { total: totalCustomers },
      invoices:        { total: totalInvoices },
      pendingPayments: { amount: pendingPayments[0]?.total || 0, count: pendingPayments[0]?.count || 0 },
      recentInvoices,
      topProducts,
      monthlyData,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Reports ────────────────────────────────────────────────────────────────
router.get('/reports', auth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = { status: 'Issued' };
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to)   match.createdAt.$lte = new Date(to + 'T23:59:59');
    }

    const [categoryWise, paymentWise, dailySales] = await Promise.all([
      Invoice.aggregate([
        { $match: match },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'prod' } },
        { $unwind: { path: '$prod', preserveNullAndEmpty: true } },
        { $group: {
            _id:     { $ifNull: ['$prod.category', 'Other'] },
            revenue: { $sum: '$items.total' },
            qty:     { $sum: '$items.quantity' }
        }},
        { $sort: { revenue: -1 } }
      ]).catch(() => []),

      Invoice.aggregate([
        { $match: match },
        { $group: { _id: '$paymentMethod', total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
      ]).catch(() => []),

      Invoice.aggregate([
        { $match: match },
        { $group: {
            _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$grandTotal' },
            orders:  { $sum: 1 }
        }},
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]).catch(() => [])
    ]);

    res.json({ categoryWise, paymentWise, dailySales });
  } catch (err) {
    console.error('Reports error:', err);
    res.json({ categoryWise: [], paymentWise: [], dailySales: [] });
  }
});

module.exports = router;
