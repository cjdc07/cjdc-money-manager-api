import User from '../models/User';
import { IAccount } from '../models/Account';

// TODO: Use UserService
export async function createdBy(parent: IAccount) {
  return (await User.findById(parent.createdBy))!;
}
