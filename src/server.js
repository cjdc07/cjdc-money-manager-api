const Query = require('./resolvers/Query');
const Mutation = require('./resolvers/Mutation');
const Subscription = require('./resolvers/Subscription');
const User = require('./resolvers/User');
const Account = require('./resolvers/Account');
const Category = require('./resolvers/Category');
const Expense = require('./resolvers/Expense');
const Income = require('./resolvers/Income');
const { ApolloServer } = require('apollo-server');
const { importSchema } = require('graphql-import');

const resolvers = {
  Query,
  Mutation,
  Subscription,
  User,
  Account,
  Category,
  Expense,
  Income,
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