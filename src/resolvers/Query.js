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
  
  return {
    accounts,
    count: count ? count.value : 0,
    total: total ? total.value : 0,
  }
}

async function transactionList(parent, args, context) {
  // TODO: Filter by what??
  const { filter, account, type, skip, first, orderBy } = args;

  const transactions = await Transaction.find({
    $and: [{ type }, { $or: [{ account }, { from: account }, { to: account }] }]
  }).sort({ createdAt: 'desc' });
  const [ count ] = await Transaction.aggregate([{ '$match': { account } }]).count('value');
  const [ total ] = await Transaction.aggregate([{ '$match': { account } }]).group({
    '_id': null, // TODO: check if this relates to filter
    'value': {
      '$sum': '$amount'
    }
  });

  return {
    transactions,
    count: count ? count.value : 0,
    total: total ? total.value : 0,
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
