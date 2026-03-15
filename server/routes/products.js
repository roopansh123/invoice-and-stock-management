const express  = require('express');
const Product  = require('../models/Product');
const StockLog = require('../models/StockLog');
const { auth } = require('../middleware/auth');
const router   = express.Router();

async function generateSKU() {
  const count = await Product.countDocuments();
  return 'RFI-' + String(count + 1).padStart(4, '0');
}

router.get('/', auth, async (req, res) => {
  try {
    const { search, lowStock, page = 1, limit = 30 } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku:  { $regex: search, $options: 'i' } },
    ];
    if (lowStock === 'true') query.$expr = { $lte: ['$totalStock', '$lowStockThreshold'] };
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(query)
    ]);
    res.json({ products, total, page: Number(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/logs/stock', auth, async (req, res) => {
  try {
    const { date, productId } = req.query;
    const query = {};
    if (productId) query.product = productId;
    if (date) {
      const start = new Date(date);
      const end   = new Date(date);
      end.setDate(end.getDate() + 1);
      query.createdAt = { $gte: start, $lt: end };
    }
    const logs = await StockLog.find(query).sort({ createdAt: -1 }).limit(200)
      .populate('product', 'name sku');
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.sku) data.sku = await generateSKU();
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/:id/stock', auth, async (req, res) => {
  try {
    const { size, bags, qtyToAdd, note } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    const actualQty = Number(qtyToAdd) || (Number(bags) * (product.bagQty || 12));
    const sizeEntry = product.sizeStock.find(s => s.size === size);
    if (sizeEntry) {
      sizeEntry.stock += actualQty;
    } else {
      product.sizeStock.push({ size, stock: actualQty });
    }
    await product.save();
    await StockLog.create({
      product: product._id, sku: product.sku, name: product.name,
      size, qtyAdded: actualQty, bags: bags || 0,
      bagQty: product.bagQty, note: note || '', addedBy: req.user?.id,
    });
    res.json({ success: true, product });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
