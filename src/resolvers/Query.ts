import mongoose from 'mongoose';
import { GraphQLRequestContext } from 'apollo-server-types';

import Account, { IAccount } from '../models/Account';
import Category, { ICategory } from '../models/Category';
import Transaction from '../models/Transaction';
import { getUserId } from '../utils';

interface AccountListArgs {
  first: number;
  skip: number;
  orderBy: string;
}

interface AccountListPayload {
  accounts: Array<IAccount>;
  total: number;
  count: number;
}

export async function accountList(parent: any, args: AccountListArgs, context: GraphQLRequestContext): Promise<AccountListPayload> {
  const { first, skip, orderBy } = args;
  const user = getUserId(context);

  const accounts: Array<IAccount> = await Account.find({createdBy: user}).sort({ createdAt: 'asc' }).limit(first);
  const [ count ] = await Account.aggregate([{ '$match': { createdBy: mongoose.Types.ObjectId(user) } }]).count('value');
  const [ total ] = await Account.aggregate([{ '$match': { createdBy: mongoose.Types.ObjectId(user) } }]).group({
    '_id': null, // TODO: check if this relates to filter
    'value': {
      '$sum': '$balance'
    }
  });

  return {
    accounts,
    total: total ? total.value : 0,
    count: count ? count.value : 0,
  }
}

interface AccountListArgs {
  filter: string;
  account: string;
  type: string
  first: number;
  skip: number;
  orderBy: string;
}

// TODO: Create Payload Interface
export async function transactionList(parent: any, args: AccountListArgs, context: GraphQLRequestContext) {
  // TODO: Filter by what??
  const { filter, account, type, skip, first, orderBy } = args;

  // TODO: Create interface
  const transactions = await Transaction.aggregate([
    {
      $match: {
        $and: [
          { type },
          {
            $or: [
              { account: mongoose.Types.ObjectId(account) },
              { from:  account },
              { to:  account }
            ]
          },
        ],
      },
    },
    { $addFields: {'id': '$_id'} },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        total: { $sum: '$amount' },
        transactions: { $push: '$$ROOT' },
      },
    },
    { $project: { _id: 0, createdAt: '$_id', count: 1, total: 1, transactions: 1 } },
    { $sort: { createdAt: -1 } },
  ]);

  return {
    transactions,
  }
}

interface CategoryListPayload {
  categories: Array<ICategory>;
  count: number;
}

export async function categoryList(parent: any, args: any, context: GraphQLRequestContext): Promise<CategoryListPayload> {
  const user = getUserId(context);

  const categories = await Category.find({
    createdBy: user,
  }).sort({ createdAt: 'asc' });

  const [ count ] = await Category.aggregate([{ '$match': { createdBy: user } }]).count('value');
  
  return {
    categories,
    count: count ? count.value : 0,
  }
}
