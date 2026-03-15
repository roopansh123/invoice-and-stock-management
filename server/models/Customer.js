const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  gstin: { type: String, trim: true, uppercase: true, default: '' },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  type: { type: String, enum: ['Retail', 'Wholesale', 'Dealer'], default: 'Retail' },
  creditLimit: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
