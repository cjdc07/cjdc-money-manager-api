const mongoose = require('mongoose');

const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const utils = require('../utils');
const { TRANSACTION_TYPE } = require('../constants');

// TODO: Create mock transfers
// TODO: Check for account value on transactions
const mockAccount = {
  _id: '5ec68df874a2f7399978b6df',
  id: '5ec68df874a2f7399978b6df',
  name: 'Test',
  balance: 1000,
  color: 'blue',
  createdBy: '5ec550287d7f9c306da064ea',
};

const mockTransferAccount = {
  _id: '5ec68df874a2f7399978b6dB',
  id: '5ec68df874a2f7399978b6dB',
  name: 'Transfer Account',
  balance: 1000,
  color: 'red',
  createdBy: '5ec550287d7f9c306da064ea',
};

const mockCategory = {
  _id: '5ec68df874a2f7399978b6e0',
  id: '5ec68df874a2f7399978b6e0',
  transaction: TRANSACTION_TYPE.GENERAL,
  value: "Account Adjustments",
};

const mockUser = {
  _id: '5ec550287d7f9c306da064ea',
  id: '5ec550287d7f9c306da064ea',
  name: 'Christian Catalan',
  email: 'cj.catalan07@gmail.com',
}

beforeAll(async (done) => { 
  await mongoose.connect(global.__MONGO_URI__, { useNewUrlParser: true, useCreateIndex: true }, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
  })
  done();
});

afterAll((done) => {
  mongoose.connection.close();
  done();
});

describe('Account Mutation', () => {
  beforeEach((done) => {
    jest.spyOn(utils, 'getUserId').mockReturnValue(mockUser._id);
    jest.spyOn(utils, 'findOrCreateCategory').mockReturnValue(mockCategory);
    done();
  });

  afterEach((done) => {
    jest.restoreAllMocks();
    mongoose.connection.db.dropDatabase(done());
  });

  it('should create an account', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const args = {
      name: 'Test',
      balance: 0,
      color: 'blue',
    };

    const account = await mutation.createAccount(null, args, {});

    expect(account).toMatchObject({
      createdBy: mongoose.Types.ObjectId(mockUser.id),
      ...args,
    });

    done();
  });

  it('should create an account with income', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const args = {
      name: 'Test',
      balance: 1000,
      color: 'blue',
    };

    const account = await mutation.createAccount(null, args, {});
    const income = await Transaction.find({ account: account.id, type: TRANSACTION_TYPE.INCOME });

    expect(income.length).toBe(1);
    expect(income[0]).toMatchObject({
      amount: args.balance,
      account: mongoose.Types.ObjectId(account.id),
      category: mongoose.Types.ObjectId(mockCategory.id),
      createdBy: mongoose.Types.ObjectId(mockUser.id),
      description: 'Initial Balance',
      from: 'Me',
      to: 'Me',
      type: TRANSACTION_TYPE.INCOME,
    });

    done();
  });

  it('should create an account with expense', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const args = {
      name: 'Test',
      balance: -1000,
      color: 'blue',
    };

    const account = await mutation.createAccount(null, args, {});
    const expenses = await Transaction.find({ account: account.id });

    // TODO: check properties

    expect(expenses.length).toBe(1);
    expect(expenses[0]).toHaveProperty('category')
    expect(expenses[0]).toMatchObject({
      description: 'Initial Balance',
      to: 'Me',
      amount: args.balance * -1,
    });

    done();
  });

  it('should update an account', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const account = new Account(mockAccount);

    await account.save();

    const args = {
      name: 'Test',
      balance: 1000,
      color: 'red',
      id: account.id
    };
    
    const updated = await mutation.updateAccount(null, args, {});

    expect(updated).toMatchObject(args);

    done();
  });

  it('should update an account with income if update amount is bigger', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const account = new Account(mockAccount);

    await account.save();

    const args = {
      name: 'Test',
      balance: 1500, // Must be more than account.balance
      color: 'red',
      id: account.id
    };
    
    const updated = await mutation.updateAccount(null, args, {});
    const income = await Transaction.find({ account: updated.id, type: TRANSACTION_TYPE.INCOME });

    expect(income.length).toBe(1);
    expect(income[0]).toHaveProperty('category');
    expect(income[0]).toMatchObject({
      description: 'Account Adjustments',
      from: 'Me',
      amount: args.balance - account.balance,
    });

    done();
  });

  it('should update an account with expense if update amount is smaller', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const account = new Account(mockAccount);

    await account.save();

    const args = {
      name: 'Test',
      balance: 500, // Must be less than account.balance
      color: 'red',
      id: account.id
    };
    
    const updated = await mutation.updateAccount(null, args, {});
    const expenses = await Transaction.find({ account: updated.id });

    expect(expenses.length).toBe(1);
    expect(expenses[0]).toHaveProperty('category');
    expect(expenses[0]).toMatchObject({
      description: 'Account Adjustments',
      to: 'Me',
      amount: account.balance - args.balance,
    });

    done();
  });

  it('should delete an account and all of its transactions', async(done) => {
    // TODO: Create transactions first!
    const mutation = require('../resolvers/Mutation');
    const account = new Account(mockAccount);

    await account.save();

    const args = {
      id: account.id
    };

    const deleted = await mutation.deleteAccount(null, args, {});

    const transactions = await Transaction.find({ account: account.id,  });

    expect(deleted.id).toBe(account.id);
    expect(transactions.length).toBe(0);

    done();
  });
});

describe('Income Mutation', () => {
  let account;

  beforeEach(async (done) => {
    jest.spyOn(utils, 'getUserId').mockReturnValue(mockUser._id);
    account = new Account(mockAccount);
    await account.save();
    done();
  });

  afterEach((done) => {
    jest.restoreAllMocks();
    mongoose.connection.db.dropDatabase();
    done();
  });

  it('should create an income', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const args =  {
      description: 'Test',
      from: 'test-payer',
      to: 'Me',
      amount: 1000,
      notes: 'test notes',
      account: account.id,
      type: TRANSACTION_TYPE.INCOME,
      category: mockCategory.value,
    };

    const income = await mutation.createTransaction(null, args, {});
    const updatedAccount = await Account.findById(account.id);

    expect(income).toMatchObject({
      description: args.description,
      from: args.from,
      to: args.to,
      amount: args.amount,
      notes: args.notes,
      type: args.type,
    });
    expect(updatedAccount.balance).toBe(account.balance + args.amount);

    done();
  });

  it('should update an income', async(done) => {
    const income = new Transaction({
      description: 'Test',
      from: 'test-payer',
      to: 'Me',
      amount: 999,
      notes: 'test notes',
      account: account.id,
      type: TRANSACTION_TYPE.INCOME,
      category: mockCategory._id,
    });
    
    await income.save();

    const mutation = require('../resolvers/Mutation');
    const args =  {
      id: income.id,
      account: account.id,
      amount: 1000, // Must be bigger than income.amount
      description: 'Update income',
      from: 'update payer',
      notes: 'update notes',
      to: 'Me',
      type: TRANSACTION_TYPE.INCOME,
    };

    const updatedIncome = await mutation.updateTransaction(null, args, {});
    const updatedAccount = await Account.findById(account.id);

    expect(updatedIncome).toMatchObject({
      description: args.description,
      from: args.from,
      to: args.to,
      amount: args.amount,
      notes: args.notes,
    });
    expect(updatedAccount.balance).toBe(account.balance + (args.amount - income.amount));

    done();
  });

  it('should delete an income', async(done) => {
    const income = new Transaction({
      description: 'Test',
      from: 'test-payer',
      to: 'Me',
      amount: 0,
      notes: 'test notes',
      account: account.id,
      type: TRANSACTION_TYPE.INCOME,
      category: mockCategory._id,
    });
    
    await income.save();

    const mutation = require('../resolvers/Mutation');
    const args = {
      id: income.id
    };

    const deleted = await mutation.deleteTransaction(null, args, {});

    expect(deleted.id).toBe(income.id);

    done();
  });
});

describe('Expense Mutation', () => {
  let account;

  beforeEach(async (done) => {
    jest.spyOn(utils, 'getUserId').mockReturnValue(mockUser._id);
    account = new Account(mockAccount);
    await account.save();
    done();
  });

  afterEach((done) => {
    jest.restoreAllMocks();
    mongoose.connection.db.dropDatabase();
    done();
  });

  it('should create an expense', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const args =  {
      description: 'Test',
      from: 'Me',
      to: 'test-payer',
      amount: 1000,
      notes: 'test notes',
      account: account.id,
      type: TRANSACTION_TYPE.EXPENSE,
      category: mockCategory.value,
    };

    const expense = await mutation.createTransaction(null, args, {});
    const updatedAccount = await Account.findById(account.id);

    expect(expense).toMatchObject({
      description: args.description,
      from: args.from,
      to: args.to,
      amount: args.amount,
      notes: args.notes,
      type: args.type,
    });
    expect(updatedAccount.balance).toBe(account.balance - args.amount);

    done();
  });

  it('should update an expense', async(done) => {
    const expense = new Transaction({
      description: 'Test',
      from: 'Me',
      to: 'test-payer',
      amount: 0,
      notes: 'test notes',
      account: account.id,
      type: TRANSACTION_TYPE.EXPENSE,
      category: mockCategory._id,
    });
    
    await expense.save();

    const mutation = require('../resolvers/Mutation');
    const args =  {
      id: expense.id,
      account: account.id,
      amount: 1000, // Must be bigger than expense.amount
      description: 'Update expense',
      from: 'Me',
      notes: 'update notes',
      to: 'test-payer',
      type: TRANSACTION_TYPE.EXPENSE,
    };

    const updatedExpense = await mutation.updateTransaction(null, args, {});
    const updatedAccount = await Account.findById(account.id);

    expect(updatedExpense).toMatchObject({
      description: args.description,
      from: args.from,
      to: args.to,
      amount: args.amount,
      notes: args.notes,
    });
    expect(updatedAccount.balance).toBe(account.balance + (expense.amount - args.amount));

    done();
  });

  it('should delete an expense', async(done) => {
    const expense = new Transaction({
      description: 'Test',
      from: 'Me',
      to: 'test-payer',
      amount: 0,
      notes: 'test notes',
      account: account.id,
      type: TRANSACTION_TYPE.EXPENSE,
      category: mockCategory._id,
    });
    
    await expense.save();

    const mutation = require('../resolvers/Mutation');
    const args = {
      id: expense.id
    };

    const deleted = await mutation.deleteTransaction(null, args, {});

    expect(deleted.id).toBe(expense.id);

    done();
  });
});

describe('Transfer Mutation', () => {
  let account;
  let transferAccount;

  beforeEach(async (done) => {
    jest.spyOn(utils, 'getUserId').mockReturnValue(mockUser._id);
    account = new Account(mockAccount);
    transferAccount = new Account(mockTransferAccount);
    await account.save();
    await transferAccount.save();
    done();
  });

  afterEach((done) => {
    jest.restoreAllMocks();
    mongoose.connection.db.dropDatabase();
    done();
  });

  it('should create a transfer', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const args =  {
      description: 'transfer',
      from: account.id,
      to: transferAccount.id,
      amount: 1000,
      notes: 'test notes',
      account: account.id,
      type: TRANSACTION_TYPE.TRANSFER,
      category: mockCategory.value,
    };

    const transfer = await mutation.createTransaction(null, args, {});
    const fromAccount = await Account.findById(account.id);
    const toAccount = await Account.findById(transferAccount.id);

    expect(transfer).toMatchObject({
      description: args.description,
      from: args.from,
      to: args.to,
      amount: args.amount,
      notes: args.notes,
      type: args.type,
    });
    expect(fromAccount.balance).toBe(account.balance - args.amount);
    expect(toAccount.balance).toBe(transferAccount.balance + args.amount);

    done();
  });
});
