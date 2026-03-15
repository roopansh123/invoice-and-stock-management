const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku:           String,
  name:          String,
  hsn:           String,
  size:          String,
  unit:          { type: String, enum: ['pcs', 'dzn', 'bag'], default: 'pcs' },
  unitQty:       { type: Number, default: 0 },
  bags:          { type: Number, default: 0 },
  quantity:      { type: Number, required: true, min: 1 },
  bagQty:        { type: Number, default: 12 },
  unitPrice:     { type: Number, required: true },
  discount:      { type: Number, default: 0 },
  discountType:  { type: String, enum: ['percent', 'flat'], default: 'percent' },
  gstRate:       { type: Number, default: 5 },
  taxableAmount: Number,
  cgst:          Number,
  sgst:          Number,
  igst:          Number,
  total:         Number,
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber:    { type: String, unique: true },
  invoiceType:      { type: String, enum: ['GST', 'Non-GST'], default: 'GST' },
  customer:         { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerSnapshot: { name: String, phone: String, email: String, gstin: String, address: Object },
  items:            [InvoiceItemSchema],
  subtotal:         Number,
  totalDiscount:    Number,
  totalTaxable:     Number,
  totalCGST:        Number,
  totalSGST:        Number,
  totalIGST:        Number,
  totalGST:         Number,
  grandTotal:       Number,
  roundOff:         Number,
  paidAmount:       { type: Number, default: 0 },
  dueAmount:        Number,
  paymentMethod:    { type: String, enum: ['Cash','UPI','Card','Bank Transfer','Credit','Mixed'], default: 'Cash' },
  paymentStatus:    { type: String, enum: ['Paid','Partial','Unpaid'], default: 'Unpaid' },
  saleType:         { type: String, enum: ['intrastate','interstate'], default: 'intrastate' },
  notes:            String,
  status:           { type: String, enum: ['Draft','Issued','Cancelled'], default: 'Draft' },
  issuedAt:         Date,
}, { timestamps: true });

InvoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    const year  = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    this.invoiceNumber = `RFI/${year}${month}/${String(count + 1).padStart(4, '0')}`;
  }
  this.dueAmount = this.grandTotal - this.paidAmount;
  if (this.paidAmount >= this.grandTotal)  this.paymentStatus = 'Paid';
  else if (this.paidAmount > 0)            this.paymentStatus = 'Partial';
  else                                     this.paymentStatus = 'Unpaid';
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
