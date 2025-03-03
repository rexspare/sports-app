import express, { Router } from 'express';
import { UserModel } from '../models/userModel';
import { Model } from 'objection';
import { Resolvers } from './gqlTypings.generated';
export type Wrapper = (app: Router | express.Application) => void;

export interface ApolloContext {
  currentUser?: UserModel;
  isCurrentUserAdmin: boolean;
  isCurrentUserSuperAdmin: boolean;
}

export interface ModelProps {
  class: Model;
}

export type GQLResolver = {
  resolvers: Resolvers;
}