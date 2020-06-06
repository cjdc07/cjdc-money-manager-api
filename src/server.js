const { ApolloServer } = require('apollo-server');
const { importSchema } = require('graphql-import');

const Account = require('./resolvers/Account');
const Category = require('./resolvers/Category');
const Mutation = require('./resolvers/Mutation');
const Query = require('./resolvers/Query');
const Transaction = require('./resolvers/Transaction');

const resolvers = {
  Account,
  Category,
  Mutation,
  Query,
  Transaction,
}

const server = new ApolloServer({
  typeDefs: importSchema('./src/schema.graphql'),
  resolvers,
  context: request => ({
    ...request,
  }),
});

module.exports = {
  resolvers,
  server,
}