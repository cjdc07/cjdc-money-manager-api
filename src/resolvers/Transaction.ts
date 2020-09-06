import User from '../models/User';
import { ITransaction } from '../models/Transaction';
import AccountService from '../services/AccountService';
import CategoryService from '../services/CategoryService';

export async function category(parent: ITransaction) {
  return CategoryService.getCategoryById(parent.category);
}

// TODO: Use UserService
export async function createdBy(parent: ITransaction) {
  return (await User.findById(parent.createdBy))!;
}

export async function account(parent: ITransaction) {
  return AccountService.getAccount(parent.account);
}
