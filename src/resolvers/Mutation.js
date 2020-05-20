const Account = require('../models/Account');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const User = require('../models/User');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const { APP_SECRET, getUserId } = require('../utils')
const { TRANSACTION_TYPE } = require('../constants')

async function createAccount(parent, args, context) {
  const { name, balance, color } = args;
  const user = getUserId(context);

  const account = new Account({name, balance, color, createdBy: mongoose.Types.ObjectId(user)});

  await account.save();

  if (balance > 0) {
    const category = await Category.findOne({value: 'Account Adjustments'});

    const income = new Income({
      description: 'Initial Balance',
      payer: 'Me',
      amount: balance,
      category: mongoose.Types.ObjectId(category.id),
      account: mongoose.Types.ObjectId(account.id),
      createdBy: mongoose.Types.ObjectId(user)
    });

    await income.save();
  } else if (balance < 0) {
    const category = await Category.findOne({value: 'Account Adjustments'});

    const expense = new Expense({
      description: 'Initial Balance',
      recipient: 'Me',
      amount: balance,
      category: mongoose.Types.ObjectId(category.id),
      account: mongoose.Types.ObjectId(account.id),
      createdBy: mongoose.Types.ObjectId(user)
    });

    await expense.save();
  }

  return account;
}

async function updateAccount(parent, args, context) {
  const { name, balance, color, id } = args;
  const user = getUserId(context);

  const account = await Account.findById(id);

  if (balance > account.balance) {
    const category = await Category.findOne({value: 'Account Adjustments'});
  
    const income = new Income({
      description: 'Account Adjustments',
      payer: 'Me',
      amount: balance - account.balance,
      category: mongoose.Types.ObjectId(category.id),
      account: mongoose.Types.ObjectId(account.id),
      createdBy: mongoose.Types.ObjectId(user)
    });
  
    await income.save();
  } else if (balance < account.balance) {
    const category = await Category.findOne({value: 'Account Adjustments'});
  
    const expense = new Expense({
      description: 'Account Adjustments',
      recipient: 'Me',
      amount: balance - account.balance,
      category: mongoose.Types.ObjectId(category.id),
      account: mongoose.Types.ObjectId(account.id),
      createdBy: mongoose.Types.ObjectId(user)
    });
  
    await expense.save();
  }

  const updated = await Account.findByIdAndUpdate(id, { name, balance, color }, {new : true} );

  return updated;
}

async function deleteAccount(parent, args, context) {
  const { id } = args;

  const account = await Account.findOneAndDelete({_id: id});

  await Income.deleteMany({ account: id });
  await Expense.deleteMany({ account: id });

  return account;
}

async function createIncome(parent, args, context) {
  const { description, payer, amount, notes, account } = args;
  const user = getUserId(context);

  const category = await findOrCreateCategory(args.category, user, TRANSACTION_TYPE.INCOME);

  const income = new Income({
    description,
    payer,
    amount,
    notes,
    category: mongoose.Types.ObjectId(category.id),
    account: mongoose.Types.ObjectId(account),
    createdBy: mongoose.Types.ObjectId(user)
  });

  await income.save();

  const old = await Account.findById(account);

  await Account.findByIdAndUpdate(account, { balance: old.balance += income.amount });

  return income;
}

async function updateIncome(parent, args, context) {
  const { id, description, payer, amount, notes, account } = args;
  const user = getUserId(context);

  const oldIncome = await Income.findById(id);

  const category = await findOrCreateCategory(args.category, user, TRANSACTION_TYPE.INCOME);

  const updatedIncome = await Income.findByIdAndUpdate(
    id,
    { description, payer, amount, notes, account, category: mongoose.Types.ObjectId(category.id) },
    { new : true }
  );

  const oldAccount = await Account.findById(account);

  await Account.findByIdAndUpdate(account, { balance: (oldAccount.balance - oldIncome.amount) + amount });

  return updatedIncome;
}

async function deleteIncome(parent, args, context) {
  const { id } = args;

  const income = await Income.findOneAndDelete({_id: id});

  const oldAccount = await Account.findById(income.account);

  await Account.findByIdAndUpdate(income.account, { balance: oldAccount.balance - income.amount });

  return income;
}

async function createExpense(parent, args, context) {
  const { description, recipient, amount, notes, account } = args;
  const user = getUserId(context);

  const category = await findOrCreateCategory(args.category, user, TRANSACTION_TYPE.EXPENSE);

  const expense = new Expense({
    description,
    recipient,
    amount,
    notes,
    category: mongoose.Types.ObjectId(category.id),
    account: mongoose.Types.ObjectId(account),
    createdBy: mongoose.Types.ObjectId(user)
  });

  await expense.save();

  const old = await Account.findById(account);

  await Account.findByIdAndUpdate(account, { balance: old.balance -= expense.amount });

  return expense;
}


async function updateExpense(parent, args, context) {
  const { id, description, recipient, amount, notes, account } = args;
  const user = getUserId(context);

  const oldExpense = await Expense.findById(id);

  const category = await findOrCreateCategory(args.category, user, TRANSACTION_TYPE.EXPENSE);

  const updatedExpense = await Expense.findByIdAndUpdate(
    id,
    { description, recipient, amount, notes, account, category: mongoose.Types.ObjectId(category.id) },
    { new : true }
  );

  const oldAccount = await Account.findById(account);

  await Account.findByIdAndUpdate(account, { balance: (oldAccount.balance + oldExpense.amount) - amount });

  return updatedExpense;
}

async function deleteExpense(parent, args, context) {
  const { id } = args;

  const expense = await Expense.findOneAndDelete({_id: id});

  const oldAccount = await Account.findById(expense.account);

  await Account.findByIdAndUpdate(expense.account, { balance: oldAccount.balance + expense.amount });

  return expense;
}

async function createCategory(parent, args, context) {
  const { value, transactionType } = args;
  const user = getUserId(context);

  const category = new Category({
    value,
    transactionType,
    createdBy: mongoose.Types.ObjectId(user)
  });

  await category.save();

  return category;
}

async function signup(parent, args, context) {
  const { name, email } = args;
  const password = await bcrypt.hash(args.password, 10)

  const user = new User({name, email, password});

  await user.save();

  const token = jwt.sign({ userId: user.id }, APP_SECRET)

  return {
    token,
    user,
  }
}

async function login(parent, args, context) {
  const { email, password } = args;
  const user = await User.findOne({email});

  if (!user) {
    throw new Error('No such user found')
  }

  const valid = await bcrypt.compare(password, user.password)

  if (!valid) {
    throw new Error('Invalid password')
  }

  return {
    token: jwt.sign({ userId: user.id }, APP_SECRET),
    user,
  }
}

async function findOrCreateCategory(category, user, transactionType) {
  let result = await Category.findOne({value: category});

  if (!result) {
    result = new Category({
      transactionType,
      value: category,
      createdBy: mongoose.Types.ObjectId(user)
    });
  
    await result.save();
  }

  return result;
}

module.exports = {
  createAccount,
  updateAccount,
  deleteAccount,
  createIncome,
  updateIncome,
  deleteIncome,
  createExpense,
  updateExpense,
  deleteExpense,
  createCategory,
  signup,
  login,
}
