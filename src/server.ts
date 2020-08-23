import { ApolloServer } from 'apollo-server';

import typeDefs from './typeDefs';
import * as Account from './resolvers/Account';
import * as Category from './resolvers/Category';
import * as Mutation from './resolvers/Mutation';
import * as Query from './resolvers/Query';
import * as Transaction from './resolvers/Transaction';

export const resolvers = {
  Account,
  Category,
  Mutation,
  Query,
  Transaction,
}

export const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: request => ({
    ...request,
  }),
});
