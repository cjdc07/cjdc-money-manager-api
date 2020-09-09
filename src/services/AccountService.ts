/* eslint-disable max-len */
import mongoose from 'mongoose';

import Account, { IAccount } from '../models/Account';
import { ITransaction } from '../models/Transaction';
import { TRANSACTION_TYPE } from '../constants';

class AccountService {
  static async createAccount(name: string, balance: number, color: string, createdBy: string) {
    if (balance < 0) {
      throw new Error('Account balance cannot be less than 0');
    }

    const account = new Account({
      name, balance, color, createdBy,
    });
    await account.save();
    return account;
  }

  static async getAccounts(createdBy: string, skip: number, first: number) {
    return Account.find({ createdBy }).sort({ createdAt: 'asc' }).skip(skip).limit(first);
  }

  static async getTotalCount(createdBy: string) {
    const [count] = await Account.aggregate().match({ createdBy: mongoose.Types.ObjectId(createdBy) }).count('value');
    return count ? count.value : 0;
  }

  static async getTotalBalance(createdBy: string) {
    const [balance] = await Account.aggregate().match(
      { createdBy: mongoose.Types.ObjectId(createdBy) },
    ).group({
      _id: 'totalBalance',
      value: {
        $sum: '$balance',
      },
    });
    return balance ? balance.value : 0;
  }

  static async getAccount(id: string) {
    const account = await Account.findById(id);

    if (!account) {
      throw new Error('Account does not exist!');
    }

    return account;
  }

  // TODO: This looks messy. Maybe have a transactionActivity param and divide logic between delete,
  // create, update or create separate methods for INCOME, EXPENSE, and TRANSFER
  static async updateAccountBalance(account: IAccount, transaction: ITransaction, oldTransaction: ITransaction | null, isDeleteTransaction: boolean = false) {
    const {
      amount, type, to, from,
    } = transaction;
    const sourceAccount = (to === account.id && oldTransaction) ? ({ ...await Account.findById(from) }) : ({ ...account.toObject() });
    const targetAccount = type === TRANSACTION_TYPE.TRANSFER ? await Account.findById(to) : null;

    if (type === TRANSACTION_TYPE.INCOME) {
      if (isDeleteTransaction) {
        sourceAccount.balance -= amount;
      } else {
        sourceAccount.balance = (oldTransaction ? sourceAccount.balance - oldTransaction.amount : sourceAccount.balance) + amount;
      }
    } else if (type === TRANSACTION_TYPE.EXPENSE) {
      if (isDeleteTransaction) {
        sourceAccount.balance += amount;
      } else {
        sourceAccount.balance = (oldTransaction ? sourceAccount.balance + oldTransaction.amount : sourceAccount.balance) - amount;
      }
    } else if (type === TRANSACTION_TYPE.TRANSFER) {
      if (isDeleteTransaction) {
        targetAccount!.balance = targetAccount!.balance - amount;
        sourceAccount.balance += amount;
      } else {
        sourceAccount.balance = (oldTransaction ? sourceAccount.balance + oldTransaction.amount : sourceAccount.balance) - amount;
        if (oldTransaction && oldTransaction.to !== to) {
          // TODO: create unit test for this block after refactoring method
          const oldTargetAccount = await Account.findById(oldTransaction?.to);
          oldTargetAccount!.balance -= oldTransaction!.amount;
          await Account.updateOne({ _id: oldTargetAccount!.id }, { balance: oldTargetAccount!.balance });
          targetAccount!.balance += amount;
        } else {
          targetAccount!.balance = (oldTransaction ? targetAccount!.balance - oldTransaction.amount : targetAccount!.balance) + amount;
        }
      }
      await Account.updateOne({ _id: targetAccount!.id }, { balance: targetAccount!.balance });
    }

    await Account.updateOne({ _id: account.id }, { balance: sourceAccount.balance });

    return { source: sourceAccount, target: targetAccount };
  }
}

export default AccountService;
