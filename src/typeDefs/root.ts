import { gql } from 'apollo-server';

const root = gql`
  type Query { root: String }

  type Mutation { root: String }

  scalar GraphQLDateTime

  enum TransactionType {
    INCOME
    EXPENSE
    TRANSFER
  }
`;

export default root;
