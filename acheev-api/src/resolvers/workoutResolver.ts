import { CircuitModel } from "../models/circuitModel";
import { ExerciseModel } from "../models/exerciseModel";
import { ExerciseSetModel } from "../models/exerciseSetModel";
import { FavoriteModel } from "../models/favoriteModel";
import { ProgramFacetModel } from "../models/programFacetModel";
import { WorkoutModel } from "../models/workoutModel";
import { requireAdmin, secureTargetUserId } from "../shared/utilities";
import { CompletionModelType, ExerciseSetInput, FavoriteModelType, WeightUnit, Workout } from "../types/gqlTypings.generated";
import { GQLResolver } from "../types/types";
import { calculateWorkoutDurationMinutes } from "../shared/workUtils";
import { CompletionModel } from "../models/completionModel";

export const WorkoutResolver: GQLResolver = {
  resolvers: {
    Query: {
      workout: async (_, { workoutId }) => {
        return WorkoutModel.query().findById(workoutId).throwIfNotFound("Program does not exist");
      },
      workouts: async (_, { programFacetId, skillLevel }) => {
        const results = await WorkoutModel.query()
          .where({ programFacetId, skillLevel, archived: false });

        // const workoutIds = results.map(item => item.id);
        // const favoritedWorkoutIds = (await FavoriteModel.query().where({ modelType: FavoriteModelType.Workout }).whereIn('modelId', workoutIds)).map(item => item.modelId);

        // return results.map(item => ({ ...results, isFavorited: favoritedWorkoutIds.includes(`${item.id}`) })) as any
        return results;
      },
    },
    Mutation: {
      modifyWorkout: async (_, { workoutId, workoutInput }, ctx) => {
        requireAdmin(ctx);
        return WorkoutModel.query().updateAndFetchById(workoutId, workoutInput).throwIfNotFound("Program DNE");
      },
      createWorkout: async (_, { workoutInput }, ctx) => {
        requireAdmin(ctx);
        return WorkoutModel.query().insertAndFetch(workoutInput);
      },
      modifyCircuit: async (_, { circuitId, circuitInput }, ctx) => {
        requireAdmin(ctx);
        return CircuitModel.query().updateAndFetchById(circuitId, circuitInput).throwIfNotFound("Circuit DNE");
      },
      createCircuit: async (_, { circuitInput }, ctx) => {
        requireAdmin(ctx);
        return CircuitModel.query().insertAndFetch(circuitInput);
      },
      modifyExercise: async (_, { exerciseId, exerciseInput }, ctx) => {
        requireAdmin(ctx);
        return ExerciseModel.query().updateAndFetchById(exerciseId, exerciseInput).throwIfNotFound("Exercise DNE");
      },
      createExercise: async (_, { exerciseInput }, ctx) => {
        requireAdmin(ctx);
        return ExerciseModel.query().insertAndFetch(exerciseInput);
      },
      modifyExerciseSet: async (_, { exerciseSetId, exerciseSetInput }, ctx) => {
        requireAdmin(ctx);
        return ExerciseSetModel.query().updateAndFetchById(exerciseSetId, exerciseSetInput).throwIfNotFound("Exercise set DNE");
      },
      createExerciseSet: async (_, { exerciseSetInput }, ctx) => {
        requireAdmin(ctx);
        return ExerciseSetModel.query().insertAndFetch(exerciseSetInput);
      },
      createOrModifyExerciseSet: async (_, { createOrModifyExerciseSetInput }, ctx) => {
        const { exerciseSetId, exerciseId, weight, durationSeconds, repCount, archived } = createOrModifyExerciseSetInput;
        const targetUserId = secureTargetUserId(ctx);

        const exercise = await ExerciseModel.query().findById(exerciseId).throwIfNotFound('Exercise does not exist');
        const existingSet = exerciseSetId != null ?
          await ExerciseSetModel.query().findOne({ userId: targetUserId, templateId: exerciseSetId }) ?? await ExerciseSetModel.query().findById(exerciseSetId).throwIfNotFound('Exercise set does not exist')
          : null;

        const { programId, programFacetId, workoutId, circuitId } = exercise;

        const baseSetParams: Partial<ExerciseSetInput> = {
          programId, programFacetId, workoutId, circuitId, exerciseId, order: new Date().getMilliseconds(), weightUnit: WeightUnit.Pounds,
          archived,
          durationSeconds: durationSeconds ?? 30, weight: weight ?? 1, repCount
        };

        console.info({ createOrModifyExerciseSetInput, baseSetParams });

        if (existingSet == null) {
          // New set entirely
          return ExerciseSetModel.query().insertAndFetch({ ...baseSetParams, userId: targetUserId });
        } else if (existingSet.userId == null) {
          // Create a custom set to replace standard set
          return ExerciseSetModel.query().insertAndFetch({ ...baseSetParams, userId: targetUserId, templateId: existingSet.id, order: existingSet.order });
        } else {
          // Try to update existing custom set
          if (targetUserId !== existingSet.userId) {
            throw Error("User does not match set you are modifying");
          }
          return existingSet.$query().updateAndFetch({ ...baseSetParams, order: existingSet.order });
        }
      },
    },
    Workout: {
      circuits: async ({ id }) => await CircuitModel.query().where({ workoutId: id, archived: false }),
      isFavorited: async (model) => {
        if ("isFavorited" in model) {
          return (model as unknown as Workout).isFavorited;
        }

        return (await FavoriteModel.query().findOne({ modelType: FavoriteModelType.Workout, modelId: model.id, archived: false })) != null;
      },
      durationMinutes: async ({ id }) => {
        return calculateWorkoutDurationMinutes(id);
      },
      programFacet: async ({ programFacetId }) => await ProgramFacetModel.query().findById(programFacetId).throwIfNotFound('Program facet does not exist for program'),
      isCompleted: async ({ id }, _, ctx) => {
        const targetUserId = secureTargetUserId(ctx);
        const completions = await CompletionModel.query().where({ archived: false, userId: targetUserId, modelType: CompletionModelType.Workout, modelId: id });

        return completions.find(item => item.modelId === id) != null;
      }
    },
    Circuit: {
      exercises: async ({ id }) => await ExerciseModel.query().where({ circuitId: id, archived: false })
    },
    Exercise: {
      exerciseSets: async ({ id }, _, ctx) => await ExerciseSetModel.query().where({ exerciseId: id, archived: false }).andWhere(q => q.whereNull('userId').orWhere('userId', ctx.currentUser?.id ?? '-1'))
    }
  },
} 