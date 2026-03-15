const mongoose = require('mongoose');

const SizeStockSchema = new mongoose.Schema({
  size:  { type: String, required: true },
  stock: { type: Number, default: 0, min: 0 }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  sku:               { type: String, unique: true, uppercase: true, trim: true },
  name:              { type: String, required: true, trim: true },
  costPrice:         { type: Number, required: true, min: 0 },
  sellingPrice:      { type: Number, required: true, min: 0 },
  mrp:               { type: Number, min: 0, default: null },
  gstRate:           { type: Number, enum: [0, 5, 12, 18, 28], default: 5 },
  hsn:               { type: String, default: '6403' },
  bagQty:            { type: Number, default: 12, min: 1 },
  sizeStock:         [SizeStockSchema],
  totalStock:        { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  isActive:          { type: Boolean, default: true },
  supplier:          { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  description:       { type: String, default: '' },
}, { timestamps: true });

ProductSchema.pre('save', function (next) {
  this.totalStock = this.sizeStock.reduce((sum, s) => sum + s.stock, 0);
  next();
});

ProductSchema.virtual('isLowStock').get(function () {
  return this.totalStock <= this.lowStockThreshold;
});

ProductSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Product', ProductSchema);
