const mongoose = require('mongoose');

const Account = require('../models/Account');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { TRANSACTION_TYPE } = require('../constants');
const { getUserId } = require('../utils')

async function accountList(parent, args, context) {
  const { first, skip, orderBy } = args;
  const user = getUserId(context);

  const accounts = await Account.find({createdBy: user}).sort({ createdAt: 'asc' }).limit(first);
  const [ count ] = await Account.aggregate([{ '$match': {} }]).count('value');
  const [ total ] = await Account.aggregate([{ '$match': {} }]).group({
    '_id': null, // TODO: check if this relates to filter
    'value': {
      '$sum': '$balance'
    }
  });
  
  accounts.unshift(new Account({
    name: 'All Accounts',
    balance: total.value,
    color: 'black'
  }));

  return {
    accounts,
    count: count ? count.value : 0,
  }
}

async function transactionList(parent, args, context) {
  // TODO: Filter by what??
  const { filter, account, type, skip, first, orderBy } = args;

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

async function categoryList(parent, args, context) {
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

module.exports = {
  accountList,
  categoryList,
  transactionList,
}
