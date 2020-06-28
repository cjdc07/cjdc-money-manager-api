import mongoose from 'mongoose';

import { TRANSACTION_TYPE } from '../constants';

export interface ITransaction extends mongoose.Document {
  account: string;
  amount: number;
  category: string;
  createdAt: Date;
  createdBy: string;
  description: string;
  from: string;
  notes: string;
  to: string;
  type: string;
  updatedAt: Date;
}

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

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
