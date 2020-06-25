(async () => {
  const db = require('../../src/db');
  const Expense = require('./Expense');
  const Income = require('./Income');
  const Transaction = require('../../src/models/Transaction');
  const { TRANSACTION_TYPE } = require('../../src/constants')

  const mongoDbUri = 'mongodb://heroku_1ln66pzv:ogbna8f19s0f8q5p5r82pnjum0@ds157057.mlab.com:57057/heroku_1ln66pzv?authSource=heroku_1ln66pzv&readPreference=primary&appname=MongoDB%20Compass&ssl=false';

  db.connect(mongoDbUri);

  const expenses = await Expense.find({});
  const income = await Income.find({});

  const expenseTransactions = expenses.map((expense) => {
    const transaction = new Transaction({
      amount: expense.amount,
      description: expense.description,
      from: 'Me',
      notes: expense.notes,
      to: expense.recipient,
      type: TRANSACTION_TYPE.EXPENSE,
      category: expense.category,
      account: expense.account,
      createdBy: expense.createdBy,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    });

    return transaction;
  });

  const incomeTransactions = income.map((income) => {
    const transaction = new Transaction({
      amount: income.amount,
      description: income.description,
      from: income.payer,
      notes: income.notes,
      to: 'Me',
      type: TRANSACTION_TYPE.INCOME,
      category: income.category,
      account: income.account,
      createdBy: income.createdBy,
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
    });

    return transaction;
  });

  await Transaction.insertMany([...expenseTransactions, ...incomeTransactions]);

  console.log('DONE!');
})();
