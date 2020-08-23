import jwt from 'jsonwebtoken';
import { BaseContext } from 'apollo-server-types';

import Account, { IAccount } from '../models/Account';
import Category, { ICategory } from '../models/Category';
import Transaction, { ITransaction } from '../models/Transaction';
import User, { UserAuthPayload } from '../services/User';
import { IUser } from '../models/User';
import { TRANSACTION_TYPE, DEFAULT_DESCRIPTIONS } from '../constants';
import { findOrCreateCategory, authenticate, } from '../utils';
import AccountService from '../services/AccountService';
import TransactionService from '../services/TransactionService';

export async function createAccount(parent: any, args: IAccount, context: BaseContext) {
  const { name, balance, color } = args;
  const user = authenticate(context);
  const account = await AccountService.createAccount(name, balance, color, user)

  // TODO:
  const category = await findOrCreateCategory(
    DEFAULT_DESCRIPTIONS.ACCOUNT_ADJUSMENTS,
    user,
  );
  //

  await TransactionService.createInitialBalanceTransaction(account, balance, category.id);

  return account;
}

export async function updateAccount(parent: any, args: IAccount, context: BaseContext): Promise<IAccount> {
  const { name, balance, color, id } = args;
  const user = authenticate(context);
  const account = await AccountService.getAccount(id);

  // TODO:
  const category = await findOrCreateCategory(
    DEFAULT_DESCRIPTIONS.ACCOUNT_ADJUSMENTS,
    user,
  );
  //

  await TransactionService.createAccountAdjustmentTransaction(account, balance, category.id);

  return (await Account.findByIdAndUpdate(account.id, { name, balance, color }, {new : true} ))!;
}

export async function deleteAccount(parent: any, args: IAccount, context: BaseContext): Promise<IAccount> {
  const { id } = args;
  const account = await AccountService.getAccount(id);

  await Account.deleteOne({ _id: id });
  await Transaction.deleteMany({ account: id, type: { $ne: TRANSACTION_TYPE.TRANSFER } });

  // TODO: when transaction is transfer, change transfer account ownership to destination account

  return account;
}

export async function createTransaction(parent: any, args: ITransaction, context: BaseContext): Promise<ITransaction> {
  const { amount, description, from, notes, to, type } = args;
  const user = authenticate(context);
  const category = await findOrCreateCategory(args.category, user);
  const account = await AccountService.getAccount(args.account);
  const transaction = await TransactionService.createTransaction(amount, description, from, notes, to, type, category.id, account);

  await AccountService.updateAccountBalance(account, transaction, null);

  return transaction;
}

export async function updateTransaction(parent: any, args: ITransaction, context: BaseContext): Promise<ITransaction> {
  const { id, amount, description, from, notes, to, type } = args;
  const user: string = authenticate(context);
  const category: ICategory = await findOrCreateCategory(args.category, user);
  const account = await AccountService.getAccount(args.account);
  const oldTransaction = await TransactionService.getTransaction(id);
  const updatedTransaction = await TransactionService.updateTransaction(id, amount, description, from, notes, to, type, category.id, account);

  await AccountService.updateAccountBalance(account, updatedTransaction!, oldTransaction);

  return updatedTransaction!;
}

export async function deleteTransaction(parent: any, args: ITransaction, context: BaseContext): Promise<ITransaction> {
  const { id } = args;
  const transaction = await TransactionService.getTransaction(id);
  const account = await AccountService.getAccount(transaction.account);

  await AccountService.updateAccountBalance(account, transaction!, null, true);
  await Transaction.deleteOne({ _id: id });

  return transaction;
}

interface CategoryArgs {
  value: string;
  transaction: string;
}

export async function createCategory(parent: any, args: CategoryArgs, context: BaseContext): Promise<ICategory> {
  const { value, transaction } = args;
  const user = authenticate(context);

  const category = new Category({
    value,
    transaction,
    createdBy: user,
  });

  await category.save();

  return category;
}

export async function signup(parent: any, args: IUser, context: BaseContext): Promise<UserAuthPayload> {
  const user = new User(args);

  await user.save();

  const token = await user.generateToken();
  const data = (await user.getUser())!;

  return { user: data, token };
}

export async function login(parent: any, args: IUser, context: BaseContext): Promise<UserAuthPayload> {
  const user = new User(args);
  const isValid = await user.isValid();

  if (!isValid) {
    throw new Error('Invalid password');
  }

  const token = await user.generateToken();
  const data = (await user.getUser())!;

  return { user: data, token };
}

interface GoogleLoginArgs {
  oAuthToken: string;
}

export async function gmailLogin(parent: any, args: GoogleLoginArgs, context: BaseContext): Promise<UserAuthPayload> {
  const { oAuthToken } = args;
  const userInfo: any = jwt.decode(oAuthToken); // TODO: Has a lot more info other than email

  const user = new User({ username: userInfo.email, password: null, name: null });
  
  const token = await user.generateToken();
  const data = (await user.getUser())!;

  return { user: data, token };
}
