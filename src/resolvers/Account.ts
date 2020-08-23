import User, { IUser } from '../models/User';
import { IAccount } from '../models/Account';

export async function createdBy(parent: IAccount): Promise<IUser> {
  return (await User.findById(parent.createdBy))!;
}
