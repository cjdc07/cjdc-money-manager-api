import { gql } from 'apollo-server';

const account = gql`
  type Account {
    id: ID!
    name: String!
    balance: Float!
    color: String!
    createdAt: GraphQLDateTime!
    updatedAt: GraphQLDateTime!
    createdBy: User!
  }

  type Accounts {
    accounts: [Account!]!
    count: Int!
    total: Float!
  }

  extend type Query {
    accounts(skip: Int!, first: Int!): Accounts!
  }

  extend type Mutation {
    createAccount(name: String!, balance: Float!, color: String!): Account!
    updateAccount(id: ID!, name: String!, balance: Float!, color: String!): Account!
    deleteAccount(id: ID!): Account!
  }
`;

export default account;
