import { GraphQLDate, GraphQLDateTime, GraphQLTime } from "graphql-iso-date"
import GraphQLJSON from 'graphql-type-json';
import { AdminResolver } from "../resolvers/adminResolver";
import { ProfileResolver } from "../resolvers/profileResolver";
import { ProgramResolver } from "../resolvers/programResolver";
import { StatsResolver } from "../resolvers/statsResolver";
import { UserResolver } from "../resolvers/userResolver";
import { WorkoutResolver } from "../resolvers/workoutResolver";
import { GQLResolver } from "../types/types";

export const GQL_RESOLVERS: GQLResolver[] = [
  AdminResolver,
  ProfileResolver,
  ProgramResolver,
  StatsResolver,
  UserResolver,
  WorkoutResolver
];

export const GQL_SCALAR_RESOLVERS = {
  DateTime: GraphQLDateTime,
  Date: GraphQLDate,
  Time: GraphQLTime,
  JSON: GraphQLJSON
};
