const express = require('express');
const Customer = require('../models/Customer');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { search, type, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (type) query.type = type;

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query).sort({ name: 1 }).skip((page-1)*limit).limit(Number(limit));
    res.json({ customers, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const c = await Customer.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Customer not found.' });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Phone number already registered.' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });
    res.json(customer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Customer.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Customer deactivated.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET customer invoices
router.get('/:id/invoices', auth, async (req, res) => {
  try {
    const Invoice = require('../models/Invoice');
    const invoices = await Invoice.find({ customer: req.params.id }).sort({ createdAt: -1 }).limit(20);
    res.json(invoices);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
