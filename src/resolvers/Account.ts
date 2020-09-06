import User from '../models/User';
import { IAccount } from '../models/Account';

// TODO: Use UserService
// eslint-disable-next-line import/prefer-default-export
export async function createdBy(parent: IAccount) {
  return (await User.findById(parent.createdBy))!;
}
