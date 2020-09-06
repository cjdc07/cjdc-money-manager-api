import User from '../models/User';
import { ICategory } from '../models/Category';

// TODO: Use UserService
// eslint-disable-next-line import/prefer-default-export
export async function createdBy(parent: ICategory) {
  return (await User.findById(parent.createdBy))!;
}
