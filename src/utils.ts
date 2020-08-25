import jwt = require('jsonwebtoken');
import { APP_SECRET } from './constants';
import { BaseContext } from 'apollo-server-types';

export function authenticate(context: BaseContext): string {
  const Authorization = context.req.get('Authorization');

  if (Authorization) {
    const token = Authorization.replace('Bearer ', '');
    const result: string | any = jwt.verify(token, APP_SECRET);
    return result.userId;
  }

  throw new Error('Not authenticated');
}
