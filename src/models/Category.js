const mongoose = require('mongoose');

const { TRANSACTION_TYPE } = require('../constants');

const CategorySchema = new mongoose.Schema({
  value: { type: String, required: true, unique: true },
  transactionType: { type: String, required: true, enum: Object.values(TRANSACTION_TYPE) },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Category', CategorySchema);
