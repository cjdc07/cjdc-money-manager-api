import User, { IUser } from '../schemas/User';
import { ICategory } from '../schemas/Category';

export async function createdBy(parent: ICategory): Promise<IUser> {
  return (await User.findById(parent.createdBy))!;
}
