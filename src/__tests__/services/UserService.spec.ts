import * as sinon from 'sinon';
import chai, { expect } from 'chai';

import User from '../../models/User';
import UserService from '../../services/UserService';

const mockUserId = '5ef0a533c192053343e57f61';

const mockUser = new User({
  id: mockUserId,
  name: 'Mock Account',
  username: 'mockaccount@gmail.com',
  password: 'mockaccount',
});

describe('AccountService', () => {
  it('should throw an error if user is not authenticated', async () => {
    const mockContext = { req: { get: () => null } };
    expect(() => UserService.authenticate(mockContext)).to.throw('User is not authenticated!');
  });

  it('should throw an error if user does not exist', async () => {
    sinon.mock(User).expects('findOne').returns(null);
    await expect(UserService.getUser(mockUser.username)).to.be.rejectedWith('User does not exist!');
  });

  it('should throw an error if password is not valid', async () => {
    await expect(UserService.validate(mockUser.password, mockUser)).to.be.rejectedWith('Invalid password!');
  });

  it('should throw an error if creating an already existing user', async () => {
    sinon.mock(User.prototype).expects('save').throws(() =>
      new class extends Error {
        message = 'Username already exists!';
        code = 11000;
      }
    );
    await expect(UserService.createUser(mockUser.username, mockUser.name, mockUser.password)).to.be.rejectedWith('Username already exists!');
  });
});
