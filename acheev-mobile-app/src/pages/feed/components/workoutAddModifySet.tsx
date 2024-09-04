import { compact, orderBy } from 'lodash';
import React, { useEffect } from 'react';
import { Image, TouchableOpacity, View, ViewProps, StyleSheet, ScrollView } from "react-native";
import { AppInput, InputType } from '../../../shared/components/AppInput';
import { AppText } from '../../../shared/components/AppText';
import { ModalProps, ModalWrapper } from '../../../shared/components/ModalWrapper';
import { Colors } from '../../../shared/Constants';
import { CircuitFieldsFragment, CompletionsQuery, useCreateOrModifyExerciseSetMutation, } from '../../../types/gqlReactTypings.generated.d';
import CheckBox from '@react-native-community/checkbox';
import { AppButton } from '../../../shared/components/AppButton';

const iconPlusCircle = require(`../../../assets/images/icons/plus_circle.png`);
const iconPlusSquare = require(`../../../assets/images/icons/plus_square.png`);
const iconMinusSquare = require(`../../../assets/images/icons/minus_square.png`);
const iconTrash = require(`../../../assets/images/icons/trash.png`);

interface Props extends ViewProps {
  circuit: CircuitFieldsFragment;
  exercise: CircuitFieldsFragment['exercises'][0];
  exerciseSets: CircuitFieldsFragment['exercises'][0]['exerciseSets'];
  modalProps: ModalProps;
  exerciseCompletions: CompletionsQuery['completions'];
  reloadSets?: () => void;
  onComplete: (modelId: number, parentModelId: number) => void;
}

const styles = StyleSheet.create({
  wrapper: {
    width: 100, height: 40,
    backgroundColor: 'transparent', borderBottomColor: '#FFFFFFaa', borderBottomWidth: 1,
  },
  input: {
    textAlign: 'center'
  }
});

export const WorkoutAddModifySet: React.FC<Props> = ({ onComplete, reloadSets, exerciseCompletions, modalProps, circuit, exercise, exerciseSets }: Props) => {
  const [sets, setSets] = React.useState(compact(exerciseSets));

  React.useEffect(() => {
    setSets(exerciseSets);
  }, [exerciseSets.map(item => item.id).sort().join(',')])
  const [modifySetMutation] = useCreateOrModifyExerciseSetMutation();

  const maybeSave = (setId?: number) => () => {
    const set = exerciseSets.find(item => item.id === setId);
    const input = sets.find(item => item.id === setId);
    
    if (setId == null) {
      // New set
      modifySetMutation({ variables: { createOrModifyExerciseSetInput: { ...input, exerciseId: exercise.id } } })
        .then(reloadSets)
        .catch(console.error);
      return;
    }

    if (set == null || input == null) {
      console.error("Set or input is null");
      return;
    }

    if (setId == null || (input.repCount !== set.repCount || input.durationSeconds !== set.durationSeconds || input.weight !== set.weight || input.archived !== set.archived)) {
      // Change occured
      const { weight, durationSeconds, repCount, archived } = input;
      modifySetMutation({
        variables: {
          createOrModifyExerciseSetInput: {
            weight, durationSeconds, repCount, archived,
            /** Below stays constant */
            exerciseId: set.exerciseId, exerciseSetId: set.id
          }
        }
      })
        .then(reloadSets)
        .catch(err => {
          console.error(JSON.stringify(err));
        });
    }
  }

  const changeValue = React.useCallback((setId: number, value: number | boolean, field: 'durationSeconds' | 'repCount' | 'weight' | 'archived') => {
    const existingIndex = sets.findIndex(item => item.id === setId);
    const newSets = [...sets]

    if (existingIndex != null && existingIndex >= 0) {
      newSets[existingIndex] = { ...newSets[existingIndex], [field]: value }
      console.info(newSets);
    }

    setSets(newSets);
  }, [setSets, sets]);

  useEffect(() => {
    sets.forEach(set => maybeSave(set.id)());
  }, [sets]);

  const setItems = React.useMemo(() => {
    return orderBy(sets, 'order', 'asc').map((set, index) => {
      const isCompleted = exerciseCompletions.some(item => item.modelId === set.id);
      const isReps = set.repCount != null;
      return (
        <View style={{ marginBottom: 25 }} key={set.id}>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CheckBox
                value={isCompleted}
                onValueChange={(newValue) => onComplete(set.id, exercise.id)}
                boxType='square'
                style={{ width: 20, height: 20, marginRight: 20 }}
                tintColor={'#aaa'}
                onCheckColor={Colors.YELLOW}
                onTintColor={Colors.YELLOW}
              />
              <AppText semiBold style={{ fontSize: 20, color: 'white' }}>Set {index + 1}</AppText>
            </View>

            <TouchableOpacity onPress={() => {
              changeValue(set.id, true, 'archived')
            }}>
              <Image source={iconTrash} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
            </TouchableOpacity>
          </View>


          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppText style={{ color: 'white', fontSize: 18, width: 150 }}>{isReps ? 'Reps' : 'Time (secs)'}</AppText>

            <TouchableOpacity style={{ marginRight: 10 }}
              onPress={() => changeValue(set.id, (set.repCount ?? set.durationSeconds) - 1, isReps ? 'repCount' : 'durationSeconds')}
            >
              <Image source={iconMinusSquare} style={{ width: 20, height: 20 }} />
            </TouchableOpacity>
            <AppInput
              value={set.repCount ?? set.durationSeconds}
              onChange={newVal => changeValue(set.id, newVal, isReps ? 'repCount' : 'durationSeconds')}
              type={InputType.NUMBER} wrapperStyle={styles.wrapper} inputStyle={styles.input} />
            <TouchableOpacity
              onPress={() => changeValue(set.id, (set.repCount ?? set.durationSeconds) + 1, isReps ? 'repCount' : 'durationSeconds')}

              style={{ marginLeft: 10 }}>
              <Image source={iconPlusSquare} style={{ width: 20, height: 20 }} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppText style={{ color: 'white', fontSize: 18, width: 150 }}>Weight (lbs)</AppText>
            <TouchableOpacity
              onPress={() => changeValue(set.id, set.weight - 1, 'weight')}
              style={{ marginRight: 10 }}>
              <Image source={iconMinusSquare} style={{ width: 20, height: 20 }} />
            </TouchableOpacity>
            <AppInput
              value={set.weight}
              onChange={newVal => changeValue(set.id, newVal, 'weight')}
              type={InputType.NUMBER} wrapperStyle={styles.wrapper} inputStyle={styles.input} />
            <TouchableOpacity
              onPress={() => changeValue(set.id, set.weight + 1, 'weight')}
              style={{ marginLeft: 10 }}>
              <Image source={iconPlusSquare} style={{ width: 20, height: 20 }} />
            </TouchableOpacity>
          </View>
        </View >
      )
    });
  }, [circuit, sets]);


  const newModalProps: ModalProps = {
    ...modalProps,
    skipLayout: true,
    children: (
      <View style={{ backgroundColor: '#241F21', padding: 15, borderRadius: 20, marginBottom: 50, height: '100%', maxHeight: '100%' }}>
        <View style={{ justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', marginBottom: 30 }}>
          <AppText style={{ color: 'white', fontSize: 24 }} semiBold>Log</AppText>
          <TouchableOpacity
            onPress={maybeSave()}
            style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
            <AppText style={{ color: Colors.YELLOW, fontSize: 18, marginRight: 10 }}>Add set</AppText>
            <Image source={iconPlusCircle} style={{ width: 22, height: 22 }} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          <TouchableOpacity activeOpacity={100}>
            {setItems}
          </TouchableOpacity>
        </ScrollView>

        <AppButton theme='yellow' onPress={modalProps.onCancel}>Close</AppButton>
      </View>
    )
  }
  return (
    <ModalWrapper {...newModalProps} />
  )
}