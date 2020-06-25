import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BaseContext } from 'apollo-server-types';

import Account, { IAccount } from '../models/Account';
import Category, { ICategory } from '../models/Category';
import Transaction, { ITransaction } from '../models/Transaction';
import User, { IUser } from '../models/User';
import { APP_SECRET, TRANSACTION_TYPE } from '../constants';
import { findOrCreateCategory, getUserId, } from '../utils';

export async function createAccount(parent: any, args: IAccount, context: BaseContext): Promise<IAccount> {
  const { name, balance, color } = args;
  const user = getUserId(context);

  const account = new Account({name, balance, color, createdBy: user});

  await account.save();

  const category = await findOrCreateCategory(
    'Account Adjustments',
    user,
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

export async function updateAccount(parent: any, args: IAccount, context: BaseContext): Promise<IAccount> {
  const { name, balance, color, id } = args;
  const user = getUserId(context);

  const account: IAccount | null = await Account.findById(id);

  const category = await findOrCreateCategory(
    'Account Adjustments',
    user,
  );

  if (!account) {
    throw new Error('Account does not exist!');
  }

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

  return updated!;
}

export async function deleteAccount(parent: any, args: IAccount, context: BaseContext): Promise<IAccount> {
  const { id } = args;

  const account: IAccount | null = await Account.findOneAndDelete({ _id: id });

  if (!account) {
    throw new Error('Account does not exist!');
  }

  await Transaction.deleteMany({ account: id, type: { $ne: TRANSACTION_TYPE.TRANSFER } });

  // TODO: when transaction is transfer, transfer transfer account ownership to 'to' account

  return account;
}

export async function createTransaction(parent: any, args: ITransaction, context: BaseContext): Promise<ITransaction> {
  const { amount, description, from, notes, to, type } = args;
  const user: string = getUserId(context);
  const category: ICategory = await findOrCreateCategory(args.category, user);
  const account: IAccount | null = await Account.findById(args.account);

  if (!account) {
    throw new Error('Account does not exist!');
  }

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
    const toAccount: IAccount | null = await Account.findById(to);

    if (toAccount) {
      await Account.findByIdAndUpdate(to, { balance: toAccount.balance += amount });
    }

    balance = balance -= amount;
  }

  await transaction.save();
  await Account.findByIdAndUpdate(account, { balance });

  return transaction;
}

export async function updateTransaction(parent: any, args: ITransaction, context: BaseContext): Promise<ITransaction> {
  const { id, amount, description, from, notes, to, type } = args;
  const user: string = getUserId(context);
  const category: ICategory = await findOrCreateCategory(args.category, user);
  const account: IAccount | null = await Account.findById(args.account);

  if (!account) {
    throw new Error('Account does not exist!');
  }

  let balance = account.balance;

  if (type === TRANSACTION_TYPE.TRANSFER) {
    if (from === account.id && amount < 1) {
      throw new Error('Cannot transfer amount less than 1!')
    }

    if (from === account.id && amount > balance) {
      throw new Error('Insufficient amount to transfer.');
    }
  }

  const oldTransaction: ITransaction | null = await Transaction.findById(id);
  const updatedTransaction: ITransaction | null  = await Transaction.findByIdAndUpdate(
    id,
    { amount, description, from, notes, to, category: category.id, account: account.id, },
    { new: true },
  );

  if (!oldTransaction) {
    throw new Error('Transaction does not exist!');
  }

  if (type === TRANSACTION_TYPE.INCOME) {
    balance = (balance - oldTransaction.amount) + amount;
  } else if (type === TRANSACTION_TYPE.EXPENSE) {
    balance = (balance + oldTransaction.amount) - amount;
  } else if (type === TRANSACTION_TYPE.TRANSFER) {
    if (from === account.id) {
      const toAccount: IAccount | null = await Account.findById(to);
      if (toAccount) {
        await Account.findByIdAndUpdate(to, { balance: (toAccount.balance - oldTransaction.amount) + amount });
      }
      balance = (balance + oldTransaction.amount) - amount;
    } else {
      const fromAccount: IAccount | null = await Account.findById(from);
      if (fromAccount) {
        await Account.findByIdAndUpdate(from, { balance: (fromAccount.balance + oldTransaction.amount) - amount });
      }
      balance = (balance - oldTransaction.amount) + amount;
    }
  }

  await Account.findByIdAndUpdate(account, { balance }, { new: true });

  return updatedTransaction!;
}

export async function deleteTransaction(parent: any, args: ITransaction, context: BaseContext): Promise<ITransaction> {
  const { id } = args;
  const transaction: ITransaction | null = await Transaction.findOneAndDelete({ _id: id });

  if (!transaction) {
    throw new Error('Transaction does not exist!');
  }

  const account: IAccount | null = await Account.findById(transaction.account);

  if (!account) {
    throw new Error('Account does not exist!');
  }

  let balance = account.balance;

  if (transaction.type === TRANSACTION_TYPE.INCOME) {
    balance = account.balance - transaction.amount;
  } else if (transaction.type === TRANSACTION_TYPE.EXPENSE) {
    balance = account.balance + transaction.amount;
  } else if (transaction.type === TRANSACTION_TYPE.TRANSFER) {
    if (transaction.from === account.id) {
      const toAccount = await Account.findById(transaction.to);
      if (toAccount) {
        await Account.findByIdAndUpdate(transaction.to, { balance: toAccount.balance - transaction.amount });
      }
      balance = account.balance + transaction.amount;
    } else {
      const fromAccount = await Account.findById(transaction.from);
      if (fromAccount) {
        await Account.findByIdAndUpdate(transaction.from, { balance: fromAccount.balance + transaction.amount });
      }
      balance = account.balance - transaction.amount;
    }
  }

  await Account.findByIdAndUpdate(transaction.account, { balance });

  return transaction;
}

interface CategoryArgs {
  value: string;
  transaction: string;
}

export async function createCategory(parent: any, args: CategoryArgs, context: BaseContext): Promise<ICategory> {
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

interface UserAuthPayload {
  token: string;
  user: IUser;
}

export async function signup(parent: any, args: IUser, context: BaseContext): Promise<UserAuthPayload> {
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

export async function login(parent: any, args: IUser, context: BaseContext): Promise<UserAuthPayload> {
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

interface GoogleLoginArgs {
  oAuthToken: string;
}

export async function gmailLogin(parent: any, args: GoogleLoginArgs, context: BaseContext): Promise<UserAuthPayload> {
  const { oAuthToken } = args;
  const userInfo: any = jwt.decode(oAuthToken); // TODO: Has a lot more info other than email
  const user = await User.findOne({ username: userInfo.email });

  if (!user) {
    throw new Error('No such user found')
  }

  return {
    token: jwt.sign({ userId: user.id }, APP_SECRET),
    user,
  }
}
