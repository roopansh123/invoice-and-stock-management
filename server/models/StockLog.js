const mongoose = require('mongoose');

const StockLogSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku:       String,
  name:      String,
  size:      String,
  qtyAdded:  { type: Number, required: true },
  bags:      { type: Number, default: 0 },      // how many bags were added
  bagQty:    { type: Number, default: 12 },     // pcs per bag at time of entry
  note:      { type: String, default: '' },
  addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('StockLog', StockLogSchema);
