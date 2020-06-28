import User, { IUser } from '../schemas/User';
import { IAccount } from '../schemas/Account';

export async function createdBy(parent: IAccount): Promise<IUser> {
  return (await User.findById(parent.createdBy))!;
}
