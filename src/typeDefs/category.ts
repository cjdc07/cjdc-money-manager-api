import { gql } from 'apollo-server';

const category = gql`
  extend type Query {
    categories: Categories!
  }

  type Categories {
    categories: [Category!]!
    count: Int!
  }

  type Category {
    id: ID!
    value: String!
    transaction: TransactionType!
    updatedAt: GraphQLDateTime!
    createdAt: GraphQLDateTime!
    createdBy: User!
  }
`;

export default category;
