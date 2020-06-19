const Account = require('../models/Account');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, findOrCreateCategory, getUserId } = require('../utils')
const { TRANSACTION_TYPE } = require('../constants')

async function createAccount(parent, args, context) {
  const { name, balance, color } = args;
  const user = getUserId(context);

  const account = new Account({name, balance, color, createdBy: user});

  await account.save();

  const category = await findOrCreateCategory(
    'Account Adjustments',
    user,
    TRANSACTION_TYPE.GENERAL,
  );

  if (balance > 0) {
    const transaction = new Transaction({
      account: account.id,
      amount: balance,
      category: category.id,
      createdBy: user,
      description: 'Initial Balance',
      from: 'Me',
      to: 'Me',
      type: TRANSACTION_TYPE.INCOME,
    });

    await transaction.save();
  } else if (balance < 0) {
    const transaction = new Transaction({
      account: account.id,
      amount: balance * -1,
      category: category.id,
      createdBy: user,
      description: 'Initial Balance',
      from: 'Me',
      to: 'Me',
      type: TRANSACTION_TYPE.EXPENSE,
    });

    await transaction.save();
  }

  return account;
}

async function updateAccount(parent, args, context) {
  const { name, balance, color, id } = args;
  const user = getUserId(context);

  const account = await Account.findById(id);

  const category = await findOrCreateCategory(
    'Account Adjustments',
    user,
    TRANSACTION_TYPE.GENERAL,
  );

  if (balance > account.balance) {
    const transaction = new Transaction({
      account: account.id,
      amount: balance - account.balance,
      category: category.id,
      createdBy: user,
      description: 'Account Adjustments',
      from: 'Me',
      to: 'Me',
      type: TRANSACTION_TYPE.INCOME,
    });

    await transaction.save();
  } else if (balance < account.balance) {
    const transaction = new Transaction({
      account: account.id,
      amount: account.balance - balance,
      category: category.id,
      createdBy: user,
      description: 'Account Adjustments',
      from: 'Me',
      to: 'Me',
      type: TRANSACTION_TYPE.EXPENSE,
    });

    await transaction.save();
  }

  const updated = await Account.findByIdAndUpdate(id, { name, balance, color }, {new : true} );

  return updated;
}

async function deleteAccount(parent, args, context) {
  const { id } = args;

  const account = await Account.findOneAndDelete({ _id: id });

  await Transaction.deleteMany({ account: id, type: { $ne: TRANSACTION_TYPE.TRANSFER } });

  // TODO: when transaction is transfer, transfer transfer account ownership to 'to' account

  return account;
}

async function createTransaction(parent, args, context) {
  const { amount, description, from, notes, to, type } = args;
  const user = getUserId(context);
  const category = await findOrCreateCategory(args.category, user, type);
  const account = await Account.findById(args.account);
  let balance = account.balance;

  if (type === TRANSACTION_TYPE.TRANSFER) {
    if (amount < 1) {
      throw new Error('Cannot transfer amount less than 1!')
    }

    if (amount > balance) {
      throw new Error('Insufficient amount to transfer.');
    }
  }

  const transaction = new Transaction({
    amount,
    description,
    from,
    notes,
    to,
    type,
    category: category.id,
    account: account,
  });

  if (type === TRANSACTION_TYPE.INCOME) {
    balance = balance += amount;
  } else if (type === TRANSACTION_TYPE.EXPENSE) {
    balance = balance -= amount;
  } else if (type === TRANSACTION_TYPE.TRANSFER) {
    balance = balance -= amount;
    const toAccount = await Account.findById(to);
    await Account.findByIdAndUpdate(to, { balance: toAccount.balance += amount });
  }

  await transaction.save();
  await Account.findByIdAndUpdate(account, { balance });

  return transaction;
}

async function updateTransaction(parent, args, context) {
  const { id, amount, description, from, notes, to, type } = args;
  const user = getUserId(context);
  const category = await findOrCreateCategory(args.category, user, type);
  const oldTransaction = await Transaction.findById(id);
  const account = await Account.findById(args.account);
  let balance = account.balance;

  if (type === TRANSACTION_TYPE.TRANSFER) {
    if (from === account.id && amount < 1) {
      throw new Error('Cannot transfer amount less than 1!')
    }

    if (from === account.id && amount > balance) {
      throw new Error('Insufficient amount to transfer.');
    }
  }

  const updatedTransaction = await Transaction.findByIdAndUpdate(
    id,
    { amount, description, from, notes, to, category: category.id, account: account, },
    { new: true },
  );

  if (type === TRANSACTION_TYPE.INCOME) {
    balance = (balance - oldTransaction.amount) + amount;
  } else if (type === TRANSACTION_TYPE.EXPENSE) {
    balance = (balance + oldTransaction.amount) - amount;
  } else if (type === TRANSACTION_TYPE.TRANSFER) {
    if (from === account.id) {
      balance = (balance + oldTransaction.amount) - amount;
      const toAccount = await Account.findById(to);
      await Account.findByIdAndUpdate(to, { balance: (toAccount.balance - oldTransaction.amount) + amount });
    } else {
      balance = (balance - oldTransaction.amount) + amount;
      const fromAccount = await Account.findById(from);
      await Account.findByIdAndUpdate(from, { balance: (fromAccount.balance + oldTransaction.amount) - amount });
    }
  }

  await Account.findByIdAndUpdate(account, { balance }, { new: true });

  return updatedTransaction;
}

async function deleteTransaction(parent, args, context) {
  const { id } = args;
  const transaction = await Transaction.findOneAndDelete({ _id: id });
  const account = await Account.findById(transaction.account);
  let balance = account.balance;

  if (transaction.type === TRANSACTION_TYPE.INCOME) {
    balance = account.balance - transaction.amount;
  } else if (transaction.type === TRANSACTION_TYPE.EXPENSE) {
    balance = account.balance + transaction.amount;
  } else if (transaction.type === TRANSACTION_TYPE.TRANSFER) {
    if (transaction.from === account.id) {
      balance = account.balance + transaction.amount;
      const toAccount = await Account.findById(transaction.to);
      await Account.findByIdAndUpdate(transaction.to, { balance: toAccount.balance - transaction.amount });
    } else {
      balance = account.balance - transaction.amount;
      const fromAccount = await Account.findById(transaction.from);
      await Account.findByIdAndUpdate(transaction.from, { balance: fromAccount.balance + transaction.amount });
    }
  }

  await Account.findByIdAndUpdate(transaction.account, { balance });

  return transaction;
}

async function createCategory(parent, args, context) {
  const { value, transaction } = args;
  const user = getUserId(context);

  const category = new Category({
    value,
    transaction,
    createdBy: user,
  });

  await category.save();

  return category;
}

async function signup(parent, args, context) {
  const { name, username } = args;
  const password = await bcrypt.hash(args.password, 10);

  try {
    const user = new User({name, username, password});

    await user.save();

    const token = jwt.sign({ userId: user.id }, APP_SECRET)

    return {
      token,
      user,
    }
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Username already exists');
    } else {
      throw new Error(error);
    }
  }
}

async function login(parent, args, context) {
  const { username, password } = args;
  const user = await User.findOne({ username });

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

async function gmailLogin(parent, args, context) {
  const { oAuthToken } = args;
  const { email } = jwt.decode(oAuthToken); // TODO: Has a lot more info other than email
  const user = await User.findOne({ username: email });

  if (!user) {
    throw new Error('No such user found')
  }

  return {
    token: jwt.sign({ userId: user.id }, APP_SECRET),
    user,
  }
}

module.exports = {
  createAccount,
  updateAccount,
  deleteAccount,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createCategory,
  signup,
  login,
  gmailLogin,
}
