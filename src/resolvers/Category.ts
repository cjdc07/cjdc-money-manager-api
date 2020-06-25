import User, { IUser } from '../models/User';
import { ICategory } from '../models/Category';

export async function createdBy(parent: ICategory): Promise<IUser> {
  return (await User.findById(parent.createdBy))!;
}
