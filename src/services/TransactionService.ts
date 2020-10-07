/* eslint-disable max-len */
import mongoose from 'mongoose';

import Transaction from '../models/Transaction';
import { TRANSACTION_TYPE, DEFAULT_DESCRIPTIONS } from '../constants';
import { IAccount } from '../models/Account';

class TransactionService {
  private static validateAmount(amount: number, balance: number, type: TRANSACTION_TYPE) {
    if (amount <= 0) {
      throw new Error('Transaction amount cannot be less than 1');
    }

    if (type === TRANSACTION_TYPE.TRANSFER && amount > balance) {
      throw new Error('Insufficient balance to transfer amount');
    }
  }

  static async createTransaction(amount: number, description: string, from: string, notes: string | null, to: string, type: TRANSACTION_TYPE, categoryId: string, account: IAccount) {
    TransactionService.validateAmount(amount, account.balance, type);

    const transaction = new Transaction({
      amount,
      description,
      from,
      notes,
      to,
      type,
      category: categoryId,
      account: account.id,
      createdBy: account.createdBy,
    });

    await transaction.save();

    return transaction;
  }

  static async updateTransaction(id: string, amount: number, description: string, from: string, notes: string | null, to: string, type: TRANSACTION_TYPE, categoryId: string, account: IAccount) {
    const oldTransaction = await TransactionService.getTransaction(id);
    // Add oldTransaction amount to account balance. This will make sure transaction amount can be updated higher
    // than the oldTransaction amount but not higher than account.balance + oldTransaction.amount
    TransactionService.validateAmount(amount, account.balance + oldTransaction.amount, type);
    return Transaction.findByIdAndUpdate(
      { _id: id },
      {
        amount, description, from, notes, to, type, category: categoryId,
      },
      { new: true },
    );
  }

  static async createInitialBalanceTransaction(account: IAccount, amount: number, categoryId: string) {
    if (amount < 0) {
      throw new Error('Initial balance cannot be less than 0');
    }

    if (amount === 0) {
      return null;
    }

    const transaction = await TransactionService.createTransaction(
      amount,
      DEFAULT_DESCRIPTIONS.INITIAL_BALANCE,
      'Me',
      null,
      'Me',
      TRANSACTION_TYPE.INCOME,
      categoryId,
      account,
    );

    await transaction.save();

    return transaction;
  }

  static async createAccountAdjustmentTransaction(account: IAccount, newBalance: number, categoryId: string) {
    if (newBalance === account.balance) {
      return null;
    }

    const amount = newBalance > account.balance ? newBalance - account.balance : account.balance - newBalance;
    const type = newBalance > account.balance ? TRANSACTION_TYPE.INCOME : TRANSACTION_TYPE.EXPENSE;

    const transaction = await TransactionService.createTransaction(
      amount,
      DEFAULT_DESCRIPTIONS.ACCOUNT_ADJUSMENTS,
      'Me',
      null,
      'Me',
      type,
      categoryId,
      account,
    );

    await transaction.save();

    return transaction;
  }

  static async getTransactionsGroupedByDate(createdBy: string, accountId: string, type: string, skip: number, first: number) {
    const match = {
      $match: {
        $and: [
          { createdBy: mongoose.Types.ObjectId(createdBy) },
          { type },
          {
            $or: [
              { account: mongoose.Types.ObjectId(accountId) },
              { from: accountId },
              { to: accountId },
            ],
          },
        ],
      },
    };

    const addFields = { $addFields: { id: '$_id' } };

    const group = {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        total: { $sum: '$amount' },
        transactions: { $push: '$$ROOT' },
      },
    };

    const project = {
      $project: {
        _id: 0, createdAt: '$_id', count: 1, total: 1, transactions: 1,
      },
    };

    const sort = { $sort: { createdAt: -1 } };

    return Transaction.aggregate([match, { $skip: skip }, { $limit: first }, addFields, sort, group, project, sort]);
  }

  static async getTransaction(id: string) {
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      throw new Error('Transaction does not exist!');
    }

    return transaction;
  }
}

export default TransactionService;
