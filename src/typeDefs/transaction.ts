import { gql } from 'apollo-server';

const transaction = gql`
  extend type Query {
    transactions(account: ID!, type: TransactionType!, skip: Int!, first: Int!): Transactions!
  }

  extend type Mutation {
    createTransaction(
      account: ID!,
      amount: Float!,
      category: String!,
      description: String!,
      from: String!,
      notes: String,
      to: String!,
      type: TransactionType!,
    ): Transaction!

    updateTransaction(
      id: ID!,
      account: ID!
      amount: Float!,
      category: String!,
      description: String!,
      from: String!,
      notes: String,
      to: String!,
      type: TransactionType!,
    ): Transaction!

    deleteTransaction(id: ID!): Transaction!
  }

  type Transactions {
    transactions: [GroupedTransactions!]!
  }

  type GroupedTransactions {
    transactions: [Transaction!]!
    count: Int!
    total: Float!
    createdAt: GraphQLDateTime!
  }

  type Transaction {
    id: ID!
    account: Account!
    amount: Float!
    category: Category!
    createdAt: GraphQLDateTime!
    createdBy: User!
    description: String!
    from: String!
    notes: String
    to: String!
    type: TransactionType!
    updatedAt: GraphQLDateTime!
  }
`;

export default transaction;
