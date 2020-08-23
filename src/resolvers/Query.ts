import mongoose from 'mongoose';
import { GraphQLRequestContext } from 'apollo-server-types';

import AccountService from '../services/AccountService';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import { authenticate } from '../utils';
import transaction from '../typeDefs/transaction';
import TransactionService from '../services/TransactionService';

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

export function health (parent: any, args: any, context: GraphQLRequestContext) {
  return 'RUNNING'
}

export async function accounts(parent: any, args: AccountsArgs, context: GraphQLRequestContext) {
  const { first, skip } = args;
  const user = authenticate(context);

  const accounts = await AccountService.getAccounts(user, skip, first);
  const count = await AccountService.getTotalCount(user);
  const total = await AccountService.getTotalBalance(user);

  return { accounts, total, count };
}

export async function transactions(parent: any, args: TransactionArgs, context: GraphQLRequestContext) {
  const { account, type, skip, first } = args;
  const user = authenticate(context);

  const transactions = await TransactionService.getTransactionsGroupedByDate(user, account, type, skip, first);

  return { transactions };
}

export async function categories(parent: any, args: any, context: GraphQLRequestContext) {
  const user = authenticate(context);

  const categories = await Category.find({
    createdBy: user,
  }).sort({ createdAt: 'asc' });

  const [ count ] = await Category.aggregate([{ '$match': { createdBy: user } }]).count('value');
  
  return {
    categories,
    count: count ? count.value : 0,
  }
}
