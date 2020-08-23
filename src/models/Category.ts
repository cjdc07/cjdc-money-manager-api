import mongoose from 'mongoose';

export interface ICategory extends mongoose.Document {
  value: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const CategorySchema = new mongoose.Schema({
  value: { type: String, required: true, unique: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export default mongoose.model<ICategory>('Category', CategorySchema);
