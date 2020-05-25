const mongoose = require('mongoose');

const Account = require('../models/Account');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const utils = require('../utils');

// TODO: Create mock user
// TODO: Create mock category

const testAccount = {
  name: 'Test',
  balance: 0, // Important that this is 0 so it will be easier to test transactions
  color: 'blue',
  createdBy: '5ec550287d7f9c306da064ea',
};

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
  let getUserIdSpy;
  let findOrCreateCategorySpy;

  beforeEach((done) => {
    getUserIdSpy = jest.spyOn(utils, 'getUserId')
      .mockReturnValue('test-user-id');

    findOrCreateCategorySpy = jest.spyOn(utils, 'findOrCreateCategory')
      .mockReturnValue({id: '5ec68df874a2f7399978b6e0'});

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

    expect(account).toMatchObject(args);

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
    const income = await Income.find({ account: account.id });

    expect(income.length).toBe(1);
    expect(income[0]).toHaveProperty('category');
    expect(income[0]).toMatchObject({
      description: 'Initial Balance',
      payer: 'Me',
      amount: args.balance,
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
    const expenses = await Expense.find({ account: account.id });

    expect(expenses.length).toBe(1);
    expect(expenses[0]).toHaveProperty('category')
    expect(expenses[0]).toMatchObject({
      description: 'Initial Balance',
      recipient: 'Me',
      amount: args.balance * -1,
    });

    done();
  });

  it('should update an account', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const account = new Account(testAccount);

    await account.save();

    const args = {
      name: 'Test',
      balance: 1000,
      color: 'red',
      id: account.id
    };
    
    const updated = await mutation.updateAccount(null, args, {});

    console.log(updated);

    expect(updated).toMatchObject(args);

    done();
  });

  it('should update an account with income', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const account = new Account(testAccount);

    await account.save();

    const args = {
      name: 'Test',
      balance: 1000,
      color: 'red',
      id: account.id
    };
    
    const updated = await mutation.updateAccount(null, args, {});
    const income = await Income.find({ account: updated.id });

    expect(income.length).toBe(1);
    expect(income[0]).toHaveProperty('category');
    expect(income[0]).toMatchObject({
      description: 'Account Adjustments',
      payer: 'Me',
      amount: args.balance,
    });

    done();
  });

  it('should update an account with expense', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const account = new Account(testAccount);

    await account.save();

    const args = {
      name: 'Test',
      balance: -1000,
      color: 'red',
      id: account.id
    };
    
    const updated = await mutation.updateAccount(null, args, {});
    const expenses = await Expense.find({ account: updated.id });

    expect(expenses.length).toBe(1);
    expect(expenses[0]).toHaveProperty('category');
    expect(expenses[0]).toMatchObject({
      description: 'Account Adjustments',
      recipient: 'Me',
      amount: args.balance * -1,
    });

    done();
  });

  it('should delete an account and all of its transactions', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const account = new Account(testAccount);

    await account.save();

    const args = {
      id: account.id
    };

    const deleted = await mutation.deleteAccount(null, args, {});

    const income = await Income.find({ account: account.id });
    const expenses = await Expense.find({ account: account.id });

    expect(deleted.id).toBe(account.id);
    expect(income.length).toBe(0);
    expect(expenses.length).toBe(0);

    done();
  });
});

describe('Income Mutation', () => {
  let getUserIdSpy;
  let account;

  beforeEach(async (done) => {
    getUserIdSpy = jest.spyOn(utils, 'getUserId');
    getUserIdSpy.mockReturnValue('test-user-id');

    account = new Account(testAccount);

    await account.save();

    done();
  });

  afterEach((done) => {
    getUserIdSpy.mockRestore();
    mongoose.connection.db.dropDatabase();
    done();
  });

  it('should create an income', async(done) => {
    const mutation = require('../resolvers/Mutation');
    const args =  {
      description: 'Test',
      payer: 'test-payer',
      amount: 1000,
      notes: 'test notes',
      account: account.id,
      category: 'test-category',
    };

    const income = await mutation.createIncome(null, args, {});

    expect(income).toMatchObject({
      description: args.description,
      payer: args.payer,
      amount: args.amount,
      notes: args.notes,
    });

    done();
  });

  it('should update an income', async(done) => {
    const income = new Income({
      description: 'Test',
      payer: 'test-payer',
      amount: 0,
      notes: 'test notes',
      category: '5ec68df874a2f7399978b6e0',
      account: account.id,
    });
    
    await income.save();

    const mutation = require('../resolvers/Mutation');
    const args =  {
      id: income.id,
      description: 'Update income',
      payer: 'update payer',
      amount: 1000,
      notes: 'update notes',
      account: account.id,
    };

    const updatedIncome = await mutation.updateIncome(null, args, {});
    const updatedAccount = await Account.findById(account.id);

    expect(updatedIncome).toMatchObject({
      description: 'Update income',
      payer: 'update payer',
      amount: 1000,
      notes: 'update notes',
    });
    expect(updatedAccount.balance).toBe(args.amount);

    done();
  });

  it('should delete an income', async(done) => {
    const income = new Income({
      description: 'Test',
      payer: 'test-payer',
      amount: 0,
      notes: 'test notes',
      category: '5ec68df874a2f7399978b6e0',
      account: account.id,
    });
    
    await income.save();

    const mutation = require('../resolvers/Mutation');
    const args = {
      id: income.id
    };

    const deleted = await mutation.deleteIncome(null, args, {});

    expect(deleted.id).toBe(income.id);

    done();
  });
});
