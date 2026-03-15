const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactPerson: String,
  phone: { type: String, required: true },
  email: String,
  gstin: { type: String, uppercase: true, trim: true },
  address: { street: String, city: String, state: String, pincode: String },
  paymentTerms: { type: String, default: 'Net 30' },
  totalOrders: { type: Number, default: 0 },
  outstandingAmount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const PurchaseItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String, sku: String,
  size: String,
  quantity: { type: Number, required: true, min: 1 },
  costPrice: Number,
  total: Number,
}, { _id: false });

const PurchaseSchema = new mongoose.Schema({
  purchaseNumber: { type: String, unique: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  items: [PurchaseItemSchema],
  subtotal: Number,
  totalGST: Number,
  grandTotal: Number,
  paidAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Unpaid' },
  status: { type: String, enum: ['Draft', 'Received', 'Cancelled'], default: 'Draft' },
  notes: String,
  receivedAt: Date,
}, { timestamps: true });

PurchaseSchema.pre('save', async function (next) {
  if (!this.purchaseNumber) {
    const count = await this.constructor.countDocuments();
    this.purchaseNumber = `PO/${String(count + 1).padStart(4, '0')}`;
  }
  const due = this.grandTotal - this.paidAmount;
  if (due <= 0) this.paymentStatus = 'Paid';
  else if (this.paidAmount > 0) this.paymentStatus = 'Partial';
  else this.paymentStatus = 'Unpaid';
  next();
});

module.exports = {
  Supplier: mongoose.model('Supplier', SupplierSchema),
  Purchase: mongoose.model('Purchase', PurchaseSchema),
};
