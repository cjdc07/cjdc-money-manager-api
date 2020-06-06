const mongoose = require('mongoose');
const { TRANSACTION_TYPE } = require('../constants');

const TransactionSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  amount: { type: Number, min: 0, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  createdAt: { type: Date, required: true, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, required: true },
  from: { type: String, required: true },
  notes: { type: String, default: '' },
  to: { type: String, required: true },
  type: { type: String, required: true, enum: Object.values(TRANSACTION_TYPE) },
  updatedAt: { type: Date, required: true, default: Date.now },
});

module.exports = mongoose.model('Transaction', TransactionSchema);
