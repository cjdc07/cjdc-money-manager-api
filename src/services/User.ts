import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { APP_SECRET } from '../constants';
import UserSchema, { IUser } from '../models/User';

export interface UserAuthPayload {
  token: string;
  user: IUser;
}

interface UserArgs {
  username: string;
  password: string|null;
  name: string|null;
}

class User {
  username: string;
  password: string | null;
  name: string | null;
  private document: IUser | null = null

  constructor(args: UserArgs) {
    this.username = args.username;
    this.password = args.password;
    this.name = args.name;
  }

  async getUser(): Promise<IUser|null> {
    let user = this.document;

    if (!user) {
      user = await UserSchema.findOne({ username: this.username });
      this.document = user;
    }

    if (!user) {
      throw new Error('No such user found');
    }

    return user;
  }

  async isValid(): Promise<boolean> {
    let user = this.document;
    if (!user) {
      user = (await this.getUser())!
    }
    return await bcrypt.compare(this.password!, user.password)
  }

  async generateToken(): Promise<string> {
    let user = this.document;
    if (!user) {
      user = (await this.getUser())!
    }
    return jwt.sign({ userId: user.id }, APP_SECRET)
  }

  async save() {
    const password = await bcrypt.hash(this.password!, 10);

    try {
      const user = new UserSchema({
        password,
        username: this.username,
        name: this.name,
      });

      await user.save();

      this.document = user;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Username already exists');
      } else {
        throw new Error(error);
      }
    }
  }
}

export default User;
