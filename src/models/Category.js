const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  value: { type: String, required: true, unique: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Category', CategorySchema);
