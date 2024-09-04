import { CompletionModel } from "../models/completionModel";
import { FavoriteModel } from "../models/favoriteModel";
import { FeedbackModel } from "../models/feedbackModel";
import { ProgramFacetModel } from "../models/programFacetModel";
import { RatingModel } from "../models/ratingModel";
import { WorkoutModel } from "../models/workoutModel";
import { secureTargetUserId } from "../shared/utilities";
import { FavoriteModelType } from "../types/gqlTypings.generated";
import { GQLResolver } from "../types/types";

const favoriteModelIds = async (modelType: FavoriteModelType, userId: string) => {
  return (await FavoriteModel.query().where({ archived: false, userId, modelType }).select('model_id')).map(item => item.modelId);
}

export const ProfileResolver: GQLResolver = {
  resolvers: {
    Mutation: {
      favorite: async (_, { modelId, modelType }, ctx) => {
        const targetUserId = secureTargetUserId(ctx);
        const existing = await FavoriteModel.query().findOne({ modelId, modelType, userId: targetUserId });

        console.info({ existing });

        if (existing != null) {
          return existing.$query().updateAndFetch({ archived: !existing.archived });
        }

        return FavoriteModel.query().insertAndFetch({ modelId, modelType, userId: targetUserId });
      },
      submitFeedback: async (_, { feedbackInput }, ctx) => {
        const targetUserId = secureTargetUserId(ctx);
        return !!await (FeedbackModel.query().insert({ userId: targetUserId, ...feedbackInput }));
      },
      complete: async (_, { completionInput }, ctx) => {
        const targetUserId = secureTargetUserId(ctx);
        const { modelId, modelType } = completionInput;
        const existing = await CompletionModel.query().findOne({ modelId, modelType, userId: targetUserId });

        if (existing != null) {
          return existing.$query().updateAndFetch({ /*archived: !existing.archived, */ completedAt: new Date(), archived: false });
        }

        return CompletionModel.query().insertAndFetch({ userId: targetUserId, completedAt: new Date(), ...completionInput });
      },
      submitRating: async (_, { ratingInput }, ctx) => {
        const targetUserId = secureTargetUserId(ctx);

        return !!(await RatingModel.query().insertAndFetch({ userId: targetUserId, ...ratingInput }));
      },
    },
    Query: {
      isCompleted: async (_, { userId, modelType, modelId }, ctx) => {
        const targetUserId = secureTargetUserId(ctx, userId);
        return (await CompletionModel.query().findOne({ modelId, modelType, userId: targetUserId, archived: false })) != null;
      },
      completions: async (_, { userId, modelId, modelType, parentModelId, parentModelType }, ctx) => {
        const targetUserId = secureTargetUserId(ctx, userId);
        let query = CompletionModel.query().where({ archived: false, userId: targetUserId })
        if (modelType != null) {
          query = query.where({ modelType });
        }
        if (modelId != null) {
          query = query.where({ modelId });
        }
        if (parentModelType != null) {
          query = query.where({ parentModelType });
        }
        if (parentModelId != null) {
          query = query.where({ parentModelId });
        }
        return query;
      },
      favorites: async (_, { userId, modelType }, ctx) => {
        const targetUserId = secureTargetUserId(ctx, userId);
        let query = FavoriteModel.query().where({ archived: false, userId: targetUserId })
        if (modelType != null) {
          query = query.where({ modelType });
        }
        return query;
      },
      favoriteWorkouts: async (_, { userId }, ctx) => {
        const targetUserId = secureTargetUserId(ctx, userId);
        let modelIds = await favoriteModelIds(FavoriteModelType.Workout, targetUserId);

        return WorkoutModel.query().findByIds(modelIds).where({ archived: false });
      },
      favoriteProgramFacets: async (_, { userId }, ctx) => {
        const targetUserId = secureTargetUserId(ctx, userId);
        let modelIds = await favoriteModelIds(FavoriteModelType.ProgramFacet, targetUserId);

        return ProgramFacetModel.query().findByIds(modelIds).where({ archived: false });
      }
    }
  },
}