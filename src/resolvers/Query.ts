/* eslint-disable max-len */
import { GraphQLRequestContext } from 'apollo-server-types';

import AccountService from '../services/AccountService';
import Category from '../models/Category';
import TransactionService from '../services/TransactionService';
import UserService from '../services/UserService';

interface AccountsArgs {
  first: number;
  skip: number;
}

interface TransactionArgs {
  account: string;
  type: string;
  skip: number;
  first: number;
}

// eslint-disable-next-line no-unused-vars
export function health(parent: any, args: any, context: GraphQLRequestContext) {
  return 'RUNNING';
}

export async function accounts(parent: any, args: AccountsArgs, context: GraphQLRequestContext) {
  const { first, skip } = args;
  const user = UserService.authenticate(context);

  return {
    accounts: await AccountService.getAccounts(user, skip, first),
    total: await AccountService.getTotalBalance(user),
    count: await AccountService.getTotalCount(user),
  };
}

export async function transactions(parent: any, args: TransactionArgs, context: GraphQLRequestContext) {
  const {
    account, type, skip, first,
  } = args;
  const user = UserService.authenticate(context);

  return { transactions: await TransactionService.getTransactionsGroupedByDate(user, account, type, skip, first) };
}

export async function categories(parent: any, args: any, context: GraphQLRequestContext) {
  const user = UserService.authenticate(context);

  const [count] = await Category.aggregate([{ $match: { createdBy: user } }]).count('value');

  return {
    categories: await Category.find({
      createdBy: user,
    }).sort({ createdAt: 'asc' }),
    count: count ? count.value : 0,
  };
}
