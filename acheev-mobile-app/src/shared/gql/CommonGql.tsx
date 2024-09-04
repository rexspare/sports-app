import { gql } from "@apollo/client";

gql`

  fragment CurrentUserFields on User {
    id
    firstName
    lastName
    fullName
    email
    phoneNumber
    iosPushToken
    androidPushToken
    private
    createdAt
    birthday
    weightUnit
    skillLevel

    location, imageUrl
  }

  fragment GenericUserFields on User {
    id
    firstName
    lastName
    fullName
    email
    phoneNumber
  }

  fragment GenericPublicUser on PublicUser {
    id imageUrl location fullName
  }

  mutation Login($phoneNumber: String, $password: String!) {
    login(phoneNumber: $phoneNumber, password: $password) { 
      user { ...CurrentUserFields }, token
    }
  }

  mutation Register($userInput: UserInput!) {
    register(userInput: $userInput) { 
      user { ...CurrentUserFields }, token
    }
  } 

  query Me {
    me {
      token
      user {
        ...CurrentUserFields
      }
    }
  }
  
  mutation ModifyUser($modifyUserInput: ModifyUserInput!, $userId: String) {
    modifyUser(modifyUserInput: $modifyUserInput, userId: $userId) {
      ...CurrentUserFields
    }
  }
  mutation ChangePassword($changePasswordInput: ChangePasswordInput!) {
    changePassword(changePasswordInput: $changePasswordInput) 
  }


  fragment ProgramFields on Program {
    id, name, imageUrl, live, archived
  }

  fragment ProgramListFields on ProgramList {
    id, name, 
      programs {
        ...ProgramFields
      }
  }

  fragment ProgramFacetFields on ProgramFacet {
    id, name, imageUrl, order, description, equipmentNeeded, videoUrl, goals, live, archived
  }

  fragment ProgramListingFields on Program {
    id, name, imageUrl, live, archived
    programFacets {
      ...ProgramFacetFields
    }
  }

  fragment ProgramFacetListingFields on ProgramFacet {
    id, name, imageUrl, order, isFavorited, description, equipmentNeeded, videoUrl, goals
    program { id, name}
  }

  query ProgramLists {
    programLists {
      ...ProgramListFields
    }
  }

  query Program($programId: Int!) {
    program(programId: $programId) {
      ...ProgramListingFields
    }
  }

  query ProgramFacet($programFacetId: Int!) {
    programFacet(programFacetId: $programFacetId) {
      ...ProgramFacetListingFields
    }
  }

  query ProgramFacetStats($programFacetId: Int!, $skillLevel: SkillLevel!) {
    programFacetStats(programFacetId: $programFacetId, skillLevel: $skillLevel) {
      weekCount, workoutCount, workoutLength 
    }
  }

  fragment WorkoutFields on Workout {
    id, programId, programFacetId, skillLevel, name, completedAt, startedAt, imageUrl, week, order, durationMinutes, isFavorited, isCompleted
  }
  query Workouts($programFacetId: Int!, $skillLevel: SkillLevel!) {
    workouts(programFacetId: $programFacetId, skillLevel: $skillLevel) {
      ...WorkoutFields
    }
  }

  fragment CircuitFields on Circuit {
    id, name, workoutId, completedAt, startedAt, order
    exercises {
      id, name, videoUrl, restDurationSeconds, description, order
      exerciseSets {
        id, exerciseId, durationSeconds, repCount, weight, weightUnit, templateId, order, archived
      }
    }
  }

  query Workout($workoutId: Int!) {
    workout(workoutId: $workoutId) {
      ...WorkoutFields
      circuits {
        ...CircuitFields
      }
    }
  }

  mutation Favorite($modelId: String!, $modelType: FavoriteModelType!) {
    favorite(modelId: $modelId, modelType: $modelType) {
      id
    }
  }

  mutation Complete($completionInput: CompletionInput!) {
    complete(completionInput: $completionInput) {
      id
    }
  }

  query Completions($modelType: CompletionModelType, $modelId: Int, $parentModelType: CompletionModelType, $parentModelId: Int) {
    completions(modelType: $modelType, modelId: $modelId, parentModelType: $parentModelType, parentModelId: $parentModelId) {
      id, modelId, modelType, parentModelId, parentModelType, completedAt
    }
  }

  mutation CreateOrModifyExerciseSet($createOrModifyExerciseSetInput: CreateOrModifyExerciseSetInput!) {
    createOrModifyExerciseSet(createOrModifyExerciseSetInput: $createOrModifyExerciseSetInput) {
      id
    }
  }

  query InProgressProgramFacets {
    inProgressProgramFacets {
      ...ProgramFacetFields 
      program { id, name}
    }
  }

  mutation RequestOtp($phoneNumber: String!) {
    requestOtp(phoneNumber: $phoneNumber)
  }

  mutation VerifyOtp($phoneNumber: String!, $otp: String!) {
    verifyOtp(phoneNumber: $phoneNumber, otp: $otp) {
      user { ...CurrentUserFields }, token
    }
  }
`;