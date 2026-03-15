const express = require('express');
const { Supplier, Purchase } = require('../models/SupplierPurchase');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const router = express.Router();

// SUPPLIERS
router.get('/suppliers', auth, async (req, res) => {
  try {
    const { search } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search } }];
    const suppliers = await Supplier.find(query).sort({ name: 1 });
    res.json(suppliers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/suppliers', auth, async (req, res) => {
  try {
    const s = await Supplier.create(req.body);
    res.status(201).json(s);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/suppliers/:id', auth, async (req, res) => {
  try {
    const s = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(s);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PURCHASES
router.get('/', auth, async (req, res) => {
  try {
    const { from, to, status, page = 1, limit = 25 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to + 'T23:59:59');
    }
    const total = await Purchase.countDocuments(query);
    const purchases = await Purchase.find(query).populate('supplier', 'name phone').sort({ createdAt: -1 })
      .skip((page-1)*limit).limit(Number(limit));
    res.json({ purchases, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { supplierId, items, notes } = req.body;
    let subtotal = 0;
    const processedItems = items.map(i => {
      const total = i.costPrice * i.quantity;
      subtotal += total;
      return { ...i, total };
    });
    const gst = subtotal * 0.05;
    const grand = subtotal + gst;

    const purchase = await Purchase.create({
      supplier: supplierId, items: processedItems, subtotal,
      totalGST: gst, grandTotal: grand, notes, status: 'Draft',
    });

    // Update supplier stats
    await Supplier.findByIdAndUpdate(supplierId, { $inc: { totalOrders: 1, outstandingAmount: grand } });
    res.status(201).json(purchase);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Mark purchase as received (update inventory)
router.patch('/:id/receive', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ error: 'Purchase not found.' });
    if (purchase.status === 'Received') return res.status(400).json({ error: 'Already received.' });

    // Add stock
    for (const item of purchase.items) {
      const existing = await Product.findOne({ _id: item.product, 'sizeStock.size': item.size });
      if (existing) {
        await Product.findOneAndUpdate(
          { _id: item.product, 'sizeStock.size': item.size },
          { $inc: { 'sizeStock.$.stock': item.quantity } }
        );
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $push: { sizeStock: { size: item.size, stock: item.quantity } }
        });
      }
      const p = await Product.findById(item.product);
      if (p) { p.totalStock = p.sizeStock.reduce((s,x)=>s+x.stock,0); await p.save(); }
    }

    purchase.status = 'Received';
    purchase.receivedAt = new Date();
    await purchase.save();
    res.json(purchase);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
