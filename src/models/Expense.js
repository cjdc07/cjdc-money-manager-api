const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, min: 0, default: 0 },
  notes: { type: String, default: '' },
  description: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
});

module.exports = mongoose.model('Expense', ExpenseSchema);
