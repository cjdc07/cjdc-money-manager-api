import mongoose from 'mongoose';

export interface IAccount extends mongoose.Document {
  id: string;
  name: string;
  balance: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const AccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  balance: { type: Number, default: 0 },
  color: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export default mongoose.model<IAccount>('Account', AccountSchema);
