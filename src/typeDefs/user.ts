import { gql } from 'apollo-server';

const user = gql`
  extend type Mutation {
    login(username: String!, password: String!): AuthPayload!
    signup(username: String!, password: String!, name: String!): AuthPayload!
  }

  type User {
    id: ID!
    name: String!
    email: String!
  }

  type AuthPayload {
    token: String
    user: User
  }
`;

export default user;
