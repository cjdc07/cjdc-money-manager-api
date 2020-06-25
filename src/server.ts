import { ApolloServer } from 'apollo-server';
import { importSchema } from 'graphql-import';

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
  typeDefs: importSchema('./src/schema.graphql'),
  resolvers,
  context: request => ({
    ...request,
  }),
});
