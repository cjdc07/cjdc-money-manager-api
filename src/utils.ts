import jwt = require('jsonwebtoken');
import { APP_SECRET } from './constants';
import { BaseContext } from 'apollo-server-types';

import Category, { ICategory } from './schemas/Category';

export function authenticate(context: BaseContext): string {
  const Authorization = context.req.get('Authorization');

  if (Authorization) {
    const token = Authorization.replace('Bearer ', '');
    const result: string | any = jwt.verify(token, APP_SECRET);
    return result.userId;
  }

  throw new Error('Not authenticated');
}

export async function findOrCreateCategory(value: string, user: string): Promise<ICategory> {
  let category = await Category.findOne({ value });

  if (!category) {
    category = new Category({
      value,
      createdBy: user,
    });
  
    await category.save();
  }

  return category;
}
