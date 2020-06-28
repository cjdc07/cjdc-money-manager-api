import Account, { IAccount } from '../schemas/Account';
import Category, { ICategory } from '../schemas/Category';
import User, { IUser } from '../schemas/User';
import { ITransaction } from '../schemas/Transaction';

export async function category(parent: ITransaction): Promise<ICategory> {
  return (await Category.findById(parent.category))!;
}

export async function createdBy(parent: ITransaction): Promise<IUser> {
  return (await User.findById(parent.createdBy))!;
}

export async function account(parent: ITransaction): Promise<IAccount> {
  return (await Account.findById(parent.account))!;
}
