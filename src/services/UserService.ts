import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { APP_SECRET } from '../constants';
import User, { IUser } from '../models/User';
import { BaseContext } from 'apollo-server-types';

class UserService {
  static authenticate(context: BaseContext) {
    const authorization = context.req.get('Authorization');

    if (!authorization) {
      throw new Error('User is not authenticated!');
    }

    const result: string | any = jwt.verify(authorization.replace('Bearer ', ''), APP_SECRET);

    return result.userId;
  }

  static async getUser(username: string) {
    const user = await User.findOne({ username });

    if (!user) {
      throw new Error('User does not exist!');
    }

    return user;
  }

  static async validate(password: string, user: IUser) {
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new Error('Invalid password!');
    }
  }

  static generateToken(user: IUser) {
    return jwt.sign({ userId: user.id }, APP_SECRET)
  }

  static async createUser(username: string, name: string, password: string) {
    const hash = await bcrypt.hash(password!, 10);

    try {
      const user = new User({
        username,
        name,
        password: hash,
      });

      return await user.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Username already exists!');
      }
      
      throw new Error(error);
    }
  }
}

export default UserService;
