const mongoose = require('mongoose');

const Account = require('../models/Account');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const { TRANSACTION_TYPE } = require('../constants');
const { getUserId } = require('../utils')

async function accountList(parent, args, context) {
  const { first, skip, orderBy } = args;
  const user = getUserId(context);

  const accounts = await Account.find({createdBy: mongoose.Types.ObjectId(user)}).sort({ createdAt: 'asc' }).limit(first);
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

async function incomeList(parent, args, context) {
  const { accountId } = args;

  const incomes = await Income.find({ account: mongoose.Types.ObjectId(accountId) }).sort({ createdAt: 'desc' });
  const [ count ] = await Income.aggregate([{ '$match': { account: mongoose.Types.ObjectId(accountId) } }]).count('value');
  const [ total ] = await Income.aggregate([{ '$match': { account: mongoose.Types.ObjectId(accountId) } }]).group({
    '_id': null, // TODO: check if this relates to filter
    'value': {
      '$sum': '$amount'
    }
  });
  
  return {
    incomes,
    count: count ? count.value : 0,
    total: total ? total.value : 0,
  }
}

async function expenseList(parent, args, context) {
  const { accountId } = args;

  const expenses = await Expense.find({ account: mongoose.Types.ObjectId(accountId) }).sort({ createdAt: 'desc' });
  const [ count ] = await Expense.aggregate([{ '$match': { account: mongoose.Types.ObjectId(accountId) } }]).count('value');
  const [ total ] = await Expense.aggregate([{ '$match': { account: mongoose.Types.ObjectId(accountId) } }]).group({
    '_id': null, // TODO: check if this relates to filter
    'value': {
      '$sum': '$amount'
    }
  });
  
  return {
    expenses,
    count: count ? count.value : 0,
    total: total ? total.value : 0,
  }
}

async function categoryList(parent, args, context) {
  const { transactionType } = args;
  const user = getUserId(context);

  const categories = await Category.find({
    $or: [{ transactionType }, { transactionType: TRANSACTION_TYPE.GENERAL }],
    createdBy: mongoose.Types.ObjectId(user)
  }).sort({ createdAt: 'asc' });

  const [ count ] = await Category.aggregate([{ '$match': { createdBy: mongoose.Types.ObjectId(user) } }]).count('value');
  
  return {
    categories,
    count: count ? count.value : 0,
  }
}

module.exports = {
  accountList,
  categoryList,
  expenseList,
  incomeList,
}
