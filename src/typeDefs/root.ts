import { gql } from 'apollo-server';

const root = gql`
  type Query { health: String }

  type Mutation { root: String }

  scalar GraphQLDateTime

  enum TransactionType {
    INCOME
    EXPENSE
    TRANSFER
  }
`;

export default root;
