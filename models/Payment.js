const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  processed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  payment_date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
