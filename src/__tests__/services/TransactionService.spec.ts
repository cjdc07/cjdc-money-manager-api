import * as sinon from 'sinon';
import { expect } from 'chai';

import Account from '../../models/Account';
import Transaction from '../../models/Transaction';
import TransactionService from '../../services/TransactionService';
import { TRANSACTION_TYPE, DEFAULT_DESCRIPTIONS } from '../../constants';

const mockUserId = '5ef0a533c192053343e57f61';
const mockAccountId = '5ef0a533c192053343e57f62';
const mockCategoryId = '5ef0a533c192053343e57f63';
const mockTransactionId = '5ef0a533c192053343e57f64';

const mockAccount = new Account({
  id: mockAccountId,
  name: 'Mock Account',
  balance: 1000,
  color: 'blue',
  createdBy: mockUserId,
});

const mockTransaction = new Transaction({
  id: mockTransactionId,
  amount: 1000,
  description: 'Test Transaction',
  from: 'Person 1',
  notes: 'A test for transaction',
  to: 'Me',
  category: mockCategoryId,
  type: TRANSACTION_TYPE.INCOME,
});

describe('TransactionService', () => {
  afterEach(() => {
    sinon.restore();
  });

  it ('should create a transaction', async () => {
    const { amount, description, from, notes, to, type, category } = mockTransaction;
 
    sinon.stub(Transaction.prototype, 'save');

    const result = await TransactionService.createTransaction(amount, description, from, notes, to, type, category, mockAccount);

    expect(result?.id).is.not.null;
    expect(result?.amount).to.equal(amount);
    expect(result?.description).to.equal(description);
    expect(result?.from).to.equal(from);
    expect(result?.notes).to.equal(notes);
    expect(result?.to).to.equal(to);
    expect(result?.type).to.equal(type);
    expect(result?.createdBy.toString()).to.equal(mockUserId);
  });

  it ('should return an error if created transaction amount is less than 1', async () => {
    sinon.stub(Transaction.prototype, 'save');
    await expect(
      TransactionService.createTransaction(0, '', '', '', '', TRANSACTION_TYPE.INCOME, '', mockAccount)
    ).to.be.rejectedWith('Transaction amount cannot be less than 1');
  });

  it ('should return an error if created transfer transaction amount is less than account balance', async () => {
    sinon.stub(Transaction.prototype, 'save');
    await expect(
      TransactionService.createTransaction(2000, '', '', '', '', TRANSACTION_TYPE.TRANSFER, '', mockAccount)
    ).to.be.rejectedWith('Insufficient balance to transfer amount');
  });

  it ('should create an initial balance income transaction if balance is more than 0', async () => {
    const balance = 1000;

    sinon.stub(Transaction.prototype, 'save');

    const result = await TransactionService.createInitialBalanceTransaction(mockAccount, balance, mockCategoryId);

    expect(result?.id).is.not.null;
    expect(result?.amount).to.equal(balance);
    expect(result?.description).to.equal(DEFAULT_DESCRIPTIONS.INITIAL_BALANCE);
    expect(result?.type).to.equal(TRANSACTION_TYPE.INCOME);
    expect(result?.createdBy.toString()).to.equal(mockUserId);
  });

  it ('should throw an error if balance is less than 0', async () => {
    const balance = -1000;

    sinon.stub(Transaction.prototype, 'save');
    
    await expect(
      TransactionService.createInitialBalanceTransaction(mockAccount, balance, mockCategoryId)
    ).to.be.rejectedWith('Initial balance cannot be less than 0');
  });

  it ('should return null if balance is 0', async () => {
    const expected = null;
    const result = await TransactionService.createInitialBalanceTransaction(mockAccount, 0, mockCategoryId);
    expect(result).to.deep.equal(expected);
  });

  it ('should create an account adjustment income transaction if new balance is more than current balance', async () => {
    const newBalance = 1500;
    const currentBalance = 1000; 
    const expectedAmount = newBalance - currentBalance;

    sinon.stub(Transaction.prototype, 'save');

    const result = await TransactionService.createAccountAdjustmentTransaction(mockAccount, newBalance, mockCategoryId);

    expect(result?.id).is.not.null;
    expect(result?.amount).to.equal(expectedAmount);
    expect(result?.description).to.equal(DEFAULT_DESCRIPTIONS.ACCOUNT_ADJUSMENTS);
    expect(result?.type).to.equal(TRANSACTION_TYPE.INCOME);
    expect(result?.createdBy.toString()).to.equal(mockUserId);
  });

  it ('should create an account adjusment expense transaction if new balance is less than current balance', async () => {
    const newBalance = 500;
    const expectedAmount = mockAccount.balance - newBalance;

    sinon.stub(Transaction.prototype, 'save');

    const result = await TransactionService.createAccountAdjustmentTransaction(mockAccount, newBalance, mockCategoryId);

    expect(result?.id).is.not.null;
    expect(result?.amount).to.equal(expectedAmount);
    expect(result?.description).to.equal(DEFAULT_DESCRIPTIONS.ACCOUNT_ADJUSMENTS);
    expect(result?.type).to.equal(TRANSACTION_TYPE.EXPENSE);
    expect(result?.createdBy.toString()).to.equal(mockUserId);
  });

  it ('should return null if there is no difference in new balance and current balance', async () => {
    const expected = null;
    sinon.stub(Transaction.prototype, 'save');
    const result = await TransactionService.createAccountAdjustmentTransaction(mockAccount, 1000, mockCategoryId);
    expect(result).to.deep.equal(expected);
  });

  it('should throw an error if transaction does not exist', async () => {
    sinon.mock(Transaction).expects('findById').returns(null);
    await expect(TransactionService.getTransaction(mockTransactionId)).to.be.rejectedWith('Transaction does not exist!');
  });

  it('should update a transaction', async () => {
    const {
      id, description, from, notes, to, type, category,
    } = mockTransaction;

    sinon.mock(TransactionService).expects('getTransaction').returns(mockTransaction);

    sinon.mock(Transaction).expects('findByIdAndUpdate').returns({
      id: mockTransactionId,
      amount: 2000,
    });

    const result = await TransactionService.updateTransaction(id, 2000, description, from, notes, to, type, category, mockAccount);

    expect(result?.id).is.not.null;
    expect(result?.amount).to.equal(2000);
  });

  it ('should return an error if updated transaction amount is less than 1', async () => {
    sinon.mock(TransactionService).expects('getTransaction').returns(mockTransaction);
    sinon.stub(Transaction.prototype, 'save');
    await expect(
      TransactionService.updateTransaction(mockTransactionId, 0, '', '', '', '', TRANSACTION_TYPE.INCOME, '', mockAccount),
    ).to.be.rejectedWith('Transaction amount cannot be less than 1');
  });

  it ('should return an error if updated transfer transaction amount is less than account balance', async () => {
    sinon.mock(TransactionService).expects('getTransaction').returns(mockTransaction);
    sinon.stub(Transaction.prototype, 'save');
    await expect(
      TransactionService.updateTransaction(mockTransactionId, 3000, '', '', '', '', TRANSACTION_TYPE.TRANSFER, '', mockAccount),
    ).to.be.rejectedWith('Insufficient balance to transfer amount');
  });
});
