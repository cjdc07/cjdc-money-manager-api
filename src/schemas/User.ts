import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  id: string;
  name: string;
  username: string;
  password: string;
}

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export default mongoose.model<IUser>('User', UserSchema);
