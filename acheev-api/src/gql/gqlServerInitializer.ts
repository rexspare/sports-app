import { ApolloContext } from "../types/types";
import { ApolloServer } from "apollo-server-express";
import { makeExecutableSchema } from "graphql-tools";
import { compact, defaultsDeep, isEmpty, last } from 'lodash';
import { UserModel } from "../models/userModel";
import { applyMiddleware } from 'graphql-middleware';
import { Resolvers } from "../types/gqlTypings.generated";
import { GQL_RESOLVERS, GQL_SCALAR_RESOLVERS } from "./gqlResolvers";
import gqlPermissions from "./gqlPermissions";
import { getGraphqlSchema } from "../shared/utilities";

export const typeDefs = getGraphqlSchema();

let combinedResolvers: Resolvers = {};
compact(GQL_RESOLVERS.map(item => item.resolvers)).forEach(item => {
  combinedResolvers = defaultsDeep(combinedResolvers, item);
});

export const resolvers = [combinedResolvers, GQL_SCALAR_RESOLVERS] as any;

const executableSchema = makeExecutableSchema({
  typeDefs, resolvers
});

const schema = applyMiddleware(executableSchema, gqlPermissions);

export function createApolloServer() {
  return new ApolloServer({
    schema,
    context: async ({ req }): Promise<ApolloContext> => {
      const token = last((req.headers.authorization || '').split(' '));
      if (isEmpty(token)) console.warn(`Auth token not set`);

      let currentUser: UserModel | undefined;
      if (!isEmpty(token)) {
        currentUser = await UserModel.query().findOne({ token });
      }


      return {
        currentUser,
        isCurrentUserAdmin: currentUser?.admin || false,
        isCurrentUserSuperAdmin: (currentUser?.admin && !currentUser.restrictedAdmin) || false,
      };
    }
  });
}
