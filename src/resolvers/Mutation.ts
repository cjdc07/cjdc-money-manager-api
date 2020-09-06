/* eslint-disable max-len */
import { BaseContext } from 'apollo-server-types';

import Account, { IAccount } from '../models/Account';
import AccountService from '../services/AccountService';
import CategoryService from '../services/CategoryService';
import Transaction, { ITransaction } from '../models/Transaction';
import TransactionService from '../services/TransactionService';
import UserService from '../services/UserService';
import { IUser } from '../models/User';
import { TRANSACTION_TYPE, DEFAULT_DESCRIPTIONS } from '../constants';

export async function createAccount(parent: any, args: IAccount, context: BaseContext) {
  const { name, balance, color } = args;
  const user = UserService.authenticate(context);
  const account = await AccountService.createAccount(name, balance, color, user);
  const category = await CategoryService.findOrCreateCategory(DEFAULT_DESCRIPTIONS.ACCOUNT_ADJUSMENTS, user);

  await TransactionService.createInitialBalanceTransaction(account, balance, category.id);

  return account;
}

export async function updateAccount(parent: any, args: IAccount, context: BaseContext): Promise<IAccount> {
  const {
    name, balance, color, id,
  } = args;
  const user = UserService.authenticate(context);
  const account = await AccountService.getAccount(id);
  const category = await CategoryService.findOrCreateCategory(DEFAULT_DESCRIPTIONS.ACCOUNT_ADJUSMENTS, user);

  await TransactionService.createAccountAdjustmentTransaction(account, balance, category.id);

  return (await Account.findByIdAndUpdate(account.id, { name, balance, color }, { new: true }))!;
}

// eslint-disable-next-line no-unused-vars
export async function deleteAccount(parent: any, args: IAccount, context: BaseContext): Promise<IAccount> {
  const { id } = args;
  const account = await AccountService.getAccount(id);

  await Account.deleteOne({ _id: id });
  await Transaction.deleteMany({ account: id, type: { $ne: TRANSACTION_TYPE.TRANSFER } });

  // TODO: when transaction is transfer, change transfer account ownership to destination account

  return account;
}

export async function createTransaction(parent: any, args: ITransaction, context: BaseContext): Promise<ITransaction> {
  const {
    amount, description, from, notes, to, type,
  } = args;
  const user = UserService.authenticate(context);
  const category = await CategoryService.findOrCreateCategory(args.category, user);
  const account = await AccountService.getAccount(args.account);
  const transaction = await TransactionService.createTransaction(amount, description, from, notes, to, type, category.id, account);

  await AccountService.updateAccountBalance(account, transaction, null);

  return transaction;
}

export async function updateTransaction(parent: any, args: ITransaction, context: BaseContext): Promise<ITransaction> {
  const {
    id, amount, description, from, notes, to, type,
  } = args;
  const user = UserService.authenticate(context);
  const category = await CategoryService.findOrCreateCategory(args.category, user);
  const account = await AccountService.getAccount(args.account);
  const oldTransaction = await TransactionService.getTransaction(id);
  const updatedTransaction = await TransactionService.updateTransaction(id, amount, description, from, notes, to, type, category.id, account);

  await AccountService.updateAccountBalance(account, updatedTransaction!, oldTransaction);

  return updatedTransaction!;
}

// eslint-disable-next-line no-unused-vars
export async function deleteTransaction(parent: any, args: ITransaction, context: BaseContext): Promise<ITransaction> {
  const { id } = args;
  const transaction = await TransactionService.getTransaction(id);
  const account = await AccountService.getAccount(transaction.account);

  await AccountService.updateAccountBalance(account, transaction!, null, true);
  await Transaction.deleteOne({ _id: id });

  return transaction;
}

// eslint-disable-next-line no-unused-vars
export async function signup(parent: any, args: IUser, context: BaseContext) {
  const { username, password, name } = args;

  const user = await UserService.createUser(username, name, password);
  const token = UserService.generateToken(user);

  return { user, token };
}

// eslint-disable-next-line no-unused-vars
export async function login(parent: any, args: IUser, context: BaseContext) {
  const { username, password } = args;
  const user = await UserService.getUser(username);

  await UserService.validate(password, user);
  const token = await UserService.generateToken(user);

  return { user, token };
}
