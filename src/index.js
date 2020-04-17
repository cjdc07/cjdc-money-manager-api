require('dotenv').config()

const Query = require('./resolvers/Query');
const Mutation = require('./resolvers/Mutation');
const Subscription = require('./resolvers/Subscription');
const User = require('./resolvers/User');
const Account = require('./resolvers/Account');
// const Vote = require('./resolvers/Vote');
const mongoose = require('mongoose');
const { GraphQLServer } = require('graphql-yoga');

const mongoDbUri = process.env.MONGODB_URI;
mongoose.connect(
  mongoDbUri,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (error) => {
    if (error) {
      throw error;
    } else {
      console.log(`Successfully connected to ${mongoDbUri}`);
    }
  }
);

const resolvers = {
  Query,
  Mutation,
  Subscription,
  User,
  Account,
  // Vote,
}

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: request => ({
    ...request,
  }),
})
server.start(() => console.log(`Server is running on http://localhost:4000`))