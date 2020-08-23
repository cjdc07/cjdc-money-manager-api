import Account, { IAccount } from '../models/Account';
import Category, { ICategory } from '../models/Category';
import User, { IUser } from '../models/User';
import { ITransaction } from '../models/Transaction';

export async function category(parent: ITransaction): Promise<ICategory> {
  return (await Category.findById(parent.category))!;
}

export async function createdBy(parent: ITransaction): Promise<IUser> {
  return (await User.findById(parent.createdBy))!;
}

export async function account(parent: ITransaction): Promise<IAccount> {
  return (await Account.findById(parent.account))!;
}
