import * as sinon from 'sinon';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import Account from '../../models/Account';
import AccountService from '../../services/AccountService';
import Transaction from '../../models/Transaction';
import { TRANSACTION_TYPE } from '../../constants';

chai.use(chaiAsPromised);

const mockAccountId = '5ef0a533c192053343e57f62';
const mockUserId = '5ef0a533c192053343e57f61';

const mockAccount = new Account({
  id: mockAccountId,
  name: 'Mock Account',
  balance: 1000,
  color: 'blue',
  createdBy: mockUserId,
});

describe('AccountService', () => {
  afterEach(() => {
    sinon.restore();
  });

  it ('should create an account', async () => {
    const { name, balance, color } = mockAccount;

    sinon.stub(Account.prototype, 'save');

    const result = await AccountService.createAccount(name, balance, color, mockUserId);

    expect(result.name).to.equal(name);
    expect(result.balance).to.equal(balance);
    expect(result.color).to.equal(color);
    expect(result.createdBy.toString()).to.equal(mockUserId);
  });

  it ('should throw an error if creating an account with a balance of less than 0', async () => {
    const { name, color } = mockAccount;
    await expect(
      AccountService.createAccount(name, -1, color, mockUserId)
    ).to.be.rejectedWith('Account balance cannot be less than 0');
  });

  it('should throw an error if account does not exist', async () =>{
    sinon.mock(Account).expects('findById').returns(null);
    await expect(AccountService.getAccount(mockAccountId)).to.be.rejectedWith('Account does not exist!');
  });

  it('should return the total balance of all accounts', async () => {
    const expected = 1000;

    sinon.mock(Account).expects('aggregate').returns({
      match: () => ({ 
        group: () => ([{
          value: expected,
        }]),
      }), 
    });

    const result = await AccountService.getTotalBalance(mockUserId);

    expect(result).to.equal(expected);
  });

  it('should return 0 balance if no accounts exists', async () => {
    const expected = 0;

    sinon.mock(Account).expects('aggregate').returns({
      match: () => ({ 
        group: () => [],
      }), 
    });

    const result = await AccountService.getTotalBalance(mockUserId);

    expect(result).to.equal(expected);
  });

  it('should return the total count of all accounts', async () => {
    const expected = 1;

    sinon.mock(Account).expects('aggregate').returns({
      match: () => ({ 
        count: () => ([{
          value: expected,
        }]),
      }), 
    });

    const result = await AccountService.getTotalCount(mockUserId);

    expect(result).to.equal(expected);
  });

  it('should return 0 counts if no accounts exists', async () => {
    const expected = 0;

    sinon.mock(Account).expects('aggregate').returns({
      match: () => ({ 
        count: () => [],
      }), 
    });

    const result = await AccountService.getTotalCount(mockUserId);

    expect(result).to.equal(expected);
  });

  it ('should add income transaction amount to account balance', async () => {
    const mockTransaction = new Transaction({
      amount: 1000,
      type: TRANSACTION_TYPE.INCOME,
    });

    sinon.stub(Account, 'updateOne');
    sinon.mock(Account).expects('findById').returns(null);

    const result = await AccountService.updateAccountBalance(mockAccount, mockTransaction, null);

    expect(result.source.balance).to.equal(2000);
  });

  it ('should deduct expense transaction amount to account balance', async () => {
    const mockTransaction = new Transaction({
      amount: 1000,
      type: TRANSACTION_TYPE.EXPENSE,
    });

    sinon.stub(Account, 'updateOne');
    sinon.mock(Account).expects('findById').returns(null);

    const result = await AccountService.updateAccountBalance(mockAccount, mockTransaction, null);

    expect(result.source.balance).to.equal(0);
  });

  it ('should deduct transfer transaction amount to source account balance and add to target account balance', async () => {
    const mockTransaction = new Transaction({
      amount: 1000,
      type: TRANSACTION_TYPE.TRANSFER,
      to: '5ef0a533c192053343e57f63',
    });

    sinon.stub(Account, 'updateOne');

    sinon.mock(Account).expects('findById').returns({
      balance: 0,
    });

    const result = await AccountService.updateAccountBalance(mockAccount, mockTransaction, null);

    expect(result.source.balance).to.equal(0);
    expect(result.target!.balance).to.equal(1000);
  });

  it ('should add updated income transaction amount to account balance', async () => {
    const mockOldTransaction = new Transaction({
      amount: 500,
      type: TRANSACTION_TYPE.INCOME,
    });

    const mockTransaction = new Transaction({
      amount: 1000,
      type: TRANSACTION_TYPE.INCOME,
    });

    sinon.stub(Account, 'updateOne');

    const result = await AccountService.updateAccountBalance(mockAccount, mockTransaction, mockOldTransaction);

    expect(result.source.balance).to.equal(1500);
  });

  it ('should update expense transaction amount to account balance', async () => {
    const mockOldTransaction = new Transaction({
      amount: 500,
      type: TRANSACTION_TYPE.EXPENSE,
    });

    const mockTransaction = new Transaction({
      amount: 1000,
      type: TRANSACTION_TYPE.EXPENSE,
    });

    sinon.stub(Account, 'updateOne');

    const result = await AccountService.updateAccountBalance(mockAccount, mockTransaction, mockOldTransaction);

    expect(result.source.balance).to.equal(500);
  });

  it ('should update transfer transaction amount to source account balance and target account balance if from === account', async () => {
    const mockOldTransaction = new Transaction({
      amount: 1000,
      type: TRANSACTION_TYPE.TRANSFER,
      to: '5ef0a533c192053343e57f63',
      from: mockAccountId,
    });

    const mockTransaction = new Transaction({
      amount: 500,
      type: TRANSACTION_TYPE.TRANSFER,
      to: '5ef0a533c192053343e57f63',
      from: mockAccountId,
    });

    sinon.stub(Account, 'updateOne');

    sinon.mock(Account).expects('findById').returns({
      id: '5ef0a533c192053343e57f63',
      balance: 1000,
    });

    const result = await AccountService.updateAccountBalance(mockAccount, mockTransaction, mockOldTransaction);

    expect(result.source.balance).to.equal(1500);
    expect(result.target!.balance).to.equal(500);
  });

  it ('should update transfer transaction amount to source account balance and target account balance if from !== account', async () => {
    const mockOldTransaction = new Transaction({
      amount: 1000,
      type: TRANSACTION_TYPE.TRANSFER,
      from: '5ef0a533c192053343e57f63',
      to: mockAccountId,
    });

    const mockTransaction = new Transaction({
      amount: 750,
      type: TRANSACTION_TYPE.TRANSFER,
      from: '5ef0a533c192053343e57f63',
      to: mockAccountId,
    });

    sinon.stub(Account, 'updateOne');

    const mockFindById = sinon.mock(Account).expects('findById');

    mockFindById.onFirstCall().returns({
      id: '5ef0a533c192053343e57f63',
      balance: 1000,
    });

    mockFindById.onSecondCall().returns({
      id: mockAccountId,
      balance: 1000,
    });

    const result = await AccountService.updateAccountBalance(mockAccount, mockTransaction, mockOldTransaction);

    expect(result.source.balance).to.equal(1250);
    expect(result.target!.balance).to.equal(750);
  });

  it ('should deduct deleted income transaction amount from account balance', async () => {
    const mockTransaction = new Transaction({
      amount: 1000,
      type: TRANSACTION_TYPE.INCOME,
    });

    sinon.stub(Account, 'updateOne');

    const result = await AccountService.updateAccountBalance(mockAccount, mockTransaction, null, true);

    expect(result.source.balance).to.equal(0);
  });

  it ('should re-add deleted expense transaction amount to account balance', async () => {
    const mockTransaction = new Transaction({
      amount: 1000,
      type: TRANSACTION_TYPE.EXPENSE,
    });

    sinon.stub(Account, 'updateOne');

    const result = await AccountService.updateAccountBalance(mockAccount, mockTransaction, null, true);

    expect(result.source.balance).to.equal(2000);
  });

  it ('should re-add deleted transfer transaction amount to source account balance and deduct from destination account', async () => {
    const mockTransaction = new Transaction({
      amount: 1000,
      type: TRANSACTION_TYPE.TRANSFER,
    });

    sinon.stub(Account, 'updateOne');

    sinon.mock(Account).expects('findById').returns({
      id: '5ef0a533c192053343e57f63',
      balance: 1000,
    });

    const result = await AccountService.updateAccountBalance(mockAccount, mockTransaction, null, true);

    expect(result.source.balance).to.equal(2000);
    expect(result.target!.balance).to.equal(0);
  });
})