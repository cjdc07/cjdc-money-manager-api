import User from '../models/User';
import { ICategory } from '../models/Category';

// TODO: Use UserService
export async function createdBy(parent: ICategory) {
  return (await User.findById(parent.createdBy))!;
}
