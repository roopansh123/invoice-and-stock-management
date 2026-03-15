const express = require('express');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Calculate invoice totals helper
function calcTotals(items, saleType) {
  let subtotal = 0, totalDiscount = 0, totalTaxable = 0, totalCGST = 0, totalSGST = 0, totalIGST = 0;

  const processedItems = items.map(item => {
    const gross = item.unitPrice * item.quantity;
    const discAmt = item.discountType === 'percent'
      ? (gross * item.discount) / 100
      : (item.discount || 0);
    const taxable = gross - discAmt;
    const gstAmt = (taxable * item.gstRate) / 100;

    let cgst = 0, sgst = 0, igst = 0;
    if (saleType === 'intrastate') { cgst = gstAmt / 2; sgst = gstAmt / 2; }
    else igst = gstAmt;

    subtotal      += gross;
    totalDiscount += discAmt;
    totalTaxable  += taxable;
    totalCGST     += cgst;
    totalSGST     += sgst;
    totalIGST     += igst;

    return { ...item, taxableAmount: taxable, cgst, sgst, igst, total: taxable + gstAmt };
  });

  const totalGST  = totalCGST + totalSGST + totalIGST;
  const grandRaw  = totalTaxable + totalGST;
  const grandTotal = Math.round(grandRaw);
  const roundOff  = +(grandTotal - grandRaw).toFixed(2);

  return { processedItems, subtotal, totalDiscount, totalTaxable, totalCGST, totalSGST, totalIGST, totalGST, grandTotal, roundOff };
}

// Normalize items — convert dzn/bag to pcs and set required fields
function normalizeItems(items) {
  return items.map(item => {
    const unit   = item.unit || 'pcs';
    const bagQty = item.bagQty || 12;
    let quantity = Number(item.quantity) || Number(item.unitQty) || 1;

    // Convert to pcs
    if (unit === 'dzn')  quantity = (Number(item.unitQty) || 1) * 12;
    if (unit === 'bag')  quantity = (Number(item.unitQty) || 1) * bagQty;
    if (unit === 'pcs')  quantity = Number(item.unitQty) || Number(item.quantity) || 1;

    return {
      ...item,
      unit,
      bagQty,
      unitQty:  Number(item.unitQty) || quantity,
      quantity, // actual pcs used for stock deduction & billing
    };
  });
}

// GET all invoices
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, paymentStatus, from, to, page = 1, limit = 25 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to)   query.createdAt.$lte = new Date(to + 'T23:59:59');
    }
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name':  { $regex: search, $options: 'i' } },
        { 'customerSnapshot.phone': { $regex: search, $options: 'i' } },
      ];
    }
    const total    = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ invoices, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single invoice
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('items.product', 'name sku');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    res.json(invoice);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create invoice
router.post('/', auth, async (req, res) => {
  try {
    const { customerId, items, saleType = 'intrastate', paidAmount = 0, paymentMethod, invoiceType, notes } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    // Normalize units (pcs / dzn / bag → actual pcs)
    const normalizedItems = normalizeItems(items);

    const { processedItems, subtotal, totalDiscount, totalTaxable, totalCGST, totalSGST, totalIGST, totalGST, grandTotal, roundOff }
      = calcTotals(normalizedItems, saleType);

    // Deduct stock (always in pcs)
    for (const item of processedItems) {
      await Product.findOneAndUpdate(
        { _id: item.product, 'sizeStock.size': item.size },
        { $inc: { 'sizeStock.$.stock': -item.quantity } }
      );
      const p = await Product.findById(item.product);
      if (p) { p.totalStock = p.sizeStock.reduce((s, x) => s + x.stock, 0); await p.save(); }
    }

    const invoice = await Invoice.create({
      customer: customerId,
      customerSnapshot: {
        name: customer.name, phone: customer.phone,
        email: customer.email, gstin: customer.gstin, address: customer.address
      },
      items: processedItems, saleType, invoiceType, paidAmount, paymentMethod, notes,
      subtotal, totalDiscount, totalTaxable, totalCGST, totalSGST, totalIGST, totalGST, grandTotal, roundOff,
      status: 'Issued', issuedAt: new Date(),
    });

    // Update customer stats
    await Customer.findByIdAndUpdate(customerId, {
      $inc: { totalPurchases: grandTotal, totalOrders: 1, outstandingBalance: grandTotal - paidAmount }
    });

    res.status(201).json(invoice);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH update payment
router.patch('/:id/payment', auth, async (req, res) => {
  try {
    const { amount, method } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    invoice.paidAmount    = Math.min(invoice.grandTotal, invoice.paidAmount + amount);
    invoice.paymentMethod = method || invoice.paymentMethod;
    await invoice.save();
    await Customer.findByIdAndUpdate(invoice.customer, { $inc: { outstandingBalance: -amount } });
    res.json(invoice);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE cancel invoice
router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status: 'Cancelled' }, { new: true });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    res.json({ message: 'Invoice cancelled.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;