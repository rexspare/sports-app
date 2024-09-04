import React from 'react';
import { TextInput, ViewProps, } from "react-native";
import { AppText } from '../../../shared/components/AppText';
import { Colors } from '../../../shared/Constants';
import { hookStateChangeInjector } from '../../../shared/Utilities';
import { ExerciseSet, ExerciseSetInput, WeightUnit, useCreateOrModifyExerciseSetMutation, } from '../../../types/gqlReactTypings.generated.d';
import { AuthContext } from '../../../shared/auth/Authentication';

interface Props extends ViewProps {
  set: Pick<ExerciseSet, 'id' | 'repCount' | 'durationSeconds' | 'weight' | 'exerciseId' | 'weightRelative'>;
  isCompleted: boolean;
  reloadSets?: () => void;
  userWeight?: number;
}

export const WorkoutCircuitInlineSetEditor: React.FC<Props> = ({
  set,
  isCompleted,
  userWeight,
  reloadSets
}: Props) => {
  const useReps = set.repCount != null && set.repCount > 0;
  const [input, setInput] = React.useState<ExerciseSetInput>({
    repCount: set.repCount,
    durationSeconds: set.durationSeconds,
    weight: set.weight
  })

  const { currentUser } = React.useContext(AuthContext);

  React.useEffect(() => {
    setInput({
      repCount: set.repCount,
      durationSeconds: set.durationSeconds,
      weight: set.weight
    })
  }, [set]);

  const [modifySetMutation] = useCreateOrModifyExerciseSetMutation();

  const change = hookStateChangeInjector(input, setInput);

  const input1Val = `${input.repCount ?? input.durationSeconds}`;
  const input2Val = `${input.weight}`;

  const maybeSave = () => {
    if (input.repCount !== set.repCount || input.durationSeconds !== set.durationSeconds || input.weight !== set.weight) {
      // Change occured
      modifySetMutation({ variables: { createOrModifyExerciseSetInput: { ...input, exerciseId: set.exerciseId, exerciseSetId: set.id } } })
        .then(reloadSets)
        .catch(console.error);
    }
  }

  return (
    <>
      <AppText style={{ color: 'rgba(255,255,255, .75)' }}>{useReps ? 'Reps' : 'Time'}: </AppText>
      <TextInput
        style={{
          minWidth: 10,
          color: isCompleted ? Colors.GREEN : Colors.YELLOW
        }}
        value={input1Val}
        selection={{ start: input1Val.length }}
        keyboardType='numeric'
        returnKeyType="done" 
        onChangeText={val => {
          let newVal = parseInt(val);
          if (isNaN(newVal)) {
            newVal = 0;
          }
          change(useReps ? 'repCount' : 'durationSeconds')(newVal);
        }}
        onBlur={maybeSave}
      />
      <AppText style={{ color: isCompleted ? Colors.GREEN : Colors.YELLOW }}>{useReps ? '' : 's'}</AppText>
      <AppText style={{ color: 'rgba(255,255,255, .75)' }}> | Weight: </AppText>
      <TextInput
        style={{
          minWidth: 10,
          color: isCompleted ? Colors.GREEN : Colors.YELLOW
        }}
        keyboardType='numeric'
        value={input2Val}
        returnKeyType="done" 
        selection={{ start: input2Val.length }}
        onChangeText={val => {
          let newVal = parseFloat(val);
          if (isNaN(newVal)) {
            newVal = 0;
          }
          change('weight')(newVal);
        }}
        onBlur={maybeSave}
      />
      {!set.weightRelative &&
        <AppText
          style={{ color: isCompleted ? Colors.GREEN : Colors.YELLOW, opacity: .7 }}> ({userWeight != null ? (Math.round(userWeight * parseFloat(input2Val))) + ` ${currentUser?.weightUnit === WeightUnit.Kilos ? 'kg' : 'lbs'}` : 'body weight'})</AppText>}
    </>
  )
}