import React from 'react';
import { PageHeader } from 'components/PageHeader';
import { gql } from '@apollo/client';
import { useWorkoutQuery, ExerciseInput, CircuitInput, useModifyCircuitMutation, useModifyExerciseMutation, useCreateCircuitMutation, useCreateExerciseMutation, useCreateExerciseSetMutation, useModifyExerciseSetMutation, ExerciseSetInput } from 'types/gqlReactTypings.generated.d';
import { useParams } from 'react-router-dom';
import { compact, orderBy } from 'lodash';
import { TableWrapper } from 'shared/tableWrapper';
import { EditText, EditTextarea } from 'react-edit-text';
import { formatDate, hookStateChangeInjector } from 'shared/Utilities';
import AppInput, { InputType } from 'components/AppInput';
import { Button, Card, Col, Row } from 'react-bootstrap';
import ReactPlayer from 'react-player'
import { FileDropzone } from 'components/fileDropzone';

interface Props {
}

const PLACEHOLDER_VIDEO = 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4';

gql`
  query Workout($workoutId: Int!) {
    workout(workoutId: $workoutId) {
      id, name, skillLevel, archived, createdAt, programId, programFacetId,
      programFacet { id, name, program { id, name}}
      circuits { 
        id, name, order, archived, createdAt, programId, programFacetId, workoutId,
        exercises {
          id, name, order, videoUrl, restDurationSeconds, description, archived, createdAt
          exerciseSets {
            id, order, durationSeconds, repCount, weight, weightRelative, weightUnit, archived, createdAt
          }
        }
       }
    }
  }

  mutation ModifyCircuit($circuitId: Int!, $circuitInput: CircuitInput!) {
    modifyCircuit(circuitId: $circuitId, circuitInput: $circuitInput) {
      id 
    }
  }

  mutation CreateCircuit($circuitInput: CircuitInput!) {
    createCircuit(circuitInput: $circuitInput) {
      id 
    }
  }

  mutation ModifyExercise($exerciseId: Int!, $exerciseInput: ExerciseInput!) {
    modifyExercise(exerciseId: $exerciseId, exerciseInput: $exerciseInput) {
      id 
    }
  }

  mutation CreateExercise($exerciseInput: ExerciseInput!) {
    createExercise(exerciseInput: $exerciseInput) {
      id
    }
  }

  mutation ModifyExerciseSet($exerciseSetId: Int!, $exerciseSetInput: ExerciseSetInput!) {
    modifyExerciseSet(exerciseSetId: $exerciseSetId, exerciseSetInput: $exerciseSetInput) {
      id 
    }
  }

  mutation CreateExerciseSet($exerciseSetInput: ExerciseSetInput!) {
    createExerciseSet(exerciseSetInput: $exerciseSetInput) {
      id
    }
  }
`

const WORKOUT_COLUMNS = [
  'Exercises',
  'Exercise Name (ID)',
  'Description',
  'Rank',
  'Rest Duration (seconds)',
  'Video',
  'Is Archived?',
  'Created At'
];

export const AdminWorkout: React.FC<Props> = () => {
  const { id } = useParams();
  const [circuitInput, setCircuitInput] = React.useState<CircuitInput>({});
  const [exerciseInput, setExerciseInput] = React.useState<ExerciseInput>({});
  const changeCircuit = hookStateChangeInjector(circuitInput, setCircuitInput);
  const changeExercise = hookStateChangeInjector(exerciseInput, setExerciseInput);
  const [modifyCircuitMutation] = useModifyCircuitMutation();
  const [modifyExerciseMutation] = useModifyExerciseMutation();
  const [modifyExerciseSetMutation] = useModifyExerciseSetMutation();
  const [createCircuitMutation] = useCreateCircuitMutation();
  const [createExerciseMutation] = useCreateExerciseMutation();
  const [createExerciseSetMutation] = useCreateExerciseSetMutation();


  const workoutQuery = useWorkoutQuery({ variables: { workoutId: parseInt(id ?? "-1") } });

  const workout = React.useMemo(() => workoutQuery.data?.workout, [workoutQuery.data?.workout]);

  console.info(changeCircuit, changeExercise);

  const modifyCircuitField = (field: keyof CircuitInput, circuitId: number) => (value: string | number | boolean) => {
    modifyCircuitMutation({ variables: { circuitId, circuitInput: { [field]: value } } })
      .catch(err => {
        console.error(err);
        window.alert("Failed to update value");
      })
  }


  const modifyExerciseField = (field: keyof ExerciseInput, exerciseId: number) => (value: string | number | boolean) => {
    return modifyExerciseMutation({ variables: { exerciseId, exerciseInput: { [field]: value } } })
      .catch(err => {
        console.error(err);
        window.alert("Failed to update value");
      })
  }

  const modifyExerciseSetField = (field: keyof ExerciseSetInput, exerciseSetId: number) => (value: string | number | boolean) => {
    modifyExerciseSetMutation({ variables: { exerciseSetId, exerciseSetInput: { [field]: value } } })
      .catch(err => {
        console.error(err);
        window.alert("Failed to update value");
      })
  }

  const onCreateCircuit = () => {
    createCircuitMutation({
      variables: {
        circuitInput: {
          ...circuitInput,
          programId: workout?.programId, programFacetId: workout?.programFacetId, workoutId: workout?.id,
        }
      }
    }).then(() => {
      workoutQuery?.refetch?.();
    }).catch(err => {
      console.error(err);
      window.alert("Failed to update value");
    })
  }

  const onCreateExercise = (circuitId: number) => () => {
    createExerciseMutation({
      variables: {
        exerciseInput: {
          programId: workout?.programId, programFacetId: workout?.programFacetId, workoutId: workout?.id, circuitId,
          name: 'TODO',
          videoUrl: PLACEHOLDER_VIDEO,
          restDurationSeconds: 30,
          description: 'TODO',
          order: 99
        }
      }
    }).then(() => {
      workoutQuery?.refetch?.();
    }).catch(err => {
      console.error(err);
      window.alert("Failed to update value");
    })
  }

  const onCreateExerciseSet = (circuitId: number, exerciseId: number) => () => {
    createExerciseSetMutation({
      variables: {
        exerciseSetInput: {
          programId: workout?.programId, programFacetId: workout?.programFacetId, workoutId: workout?.id, circuitId, exerciseId,
          order: 99,
          durationSeconds: 30,
          weight: .5
        }
      }
    }).then(() => {
      workoutQuery?.refetch?.();
    }).catch(err => {
      console.error(err);
      window.alert("Failed to update value");
    })
  }


  const sections = orderBy(compact(workout?.circuits), item => parseInt(`${item.order}`), 'asc').map(circuit => {
    return (
      <Card key={circuit.id} style={{ padding: 10, marginBottom: 20 }}>
        <Row>
          <Col sm={3}>
            <h6 style={{ marginBottom: 0 }}>Circuit Name</h6>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <EditText style={{ minWidth: 75 }} defaultValue={circuit.name} onSave={({ value }) => modifyCircuitField('name', circuit.id)(value)} />{`(${circuit.id})`}
            </div>
          </Col>
          <Col sm={3}>
            <h6 style={{ marginBottom: 0 }}>Circuit Rank</h6>
            <EditText style={{ minWidth: 75 }} type='number' defaultValue={String(circuit.order)} onSave={({ value }) => modifyCircuitField('order', circuit.id)(parseInt(value))} />
          </Col>
          <Col sm={3}>
            <h6 style={{ marginBottom: 0 }}>Circuit is Archived?</h6>
            <AppInput
              type={InputType.TOGGLE} defaultValue={circuit.archived}
              onChange={modifyCircuitField('archived', circuit.id)} />
          </Col>
        </Row>

        <TableWrapper columns={WORKOUT_COLUMNS}>
          <tbody>
            {orderBy(circuit.exercises, item => parseInt(`${item.order}`), ['asc'])
              .map(item => {
                return (
                  <>
                    <tr key={item.id}>
                      <td>{!!item.videoUrl &&
                        <ReactPlayer url={item.videoUrl} width={200} height={120} controls={true} />}</td>
                      <td style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <EditText style={{ minWidth: 75 }} defaultValue={item.name} onSave={({ value }) => modifyExerciseField('name', item.id)(value)} />{`(${item.id})`}
                      </td>
                      <td>
                        <EditTextarea defaultValue={item.description} onSave={({ value }) => modifyExerciseField('description', item.id)(value)} />
                      </td>
                      <td>
                        <EditText style={{ minWidth: 75 }} type='number' defaultValue={String(item.order)} onSave={({ value }) => modifyExerciseField('order', item.id)(parseInt(value))} />
                      </td>
                      <td>
                        <EditText style={{ minWidth: 75 }} type='number' defaultValue={String(item.restDurationSeconds)} onSave={({ value }) => modifyExerciseField('restDurationSeconds', item.id)(parseInt(value))} />
                      </td>
                      <td>
                        <FileDropzone onSuccess={file => {
                          modifyExerciseField('videoUrl', item.id)(file).then(() => {
                            workoutQuery?.refetch?.();
                          })
                        }} accept={{ 'video/*': [] }} />
                        <EditTextarea defaultValue={item.videoUrl} onSave={({ value }) => modifyExerciseField('videoUrl', item.id)(value)} key={item.videoUrl} />
                      </td>
                      <td>
                        <AppInput
                          type={InputType.TOGGLE} defaultValue={item.archived}
                          onChange={modifyExerciseField('archived', item.id)} />
                      </td>
                      <td>{formatDate(item.createdAt)}</td>
                    </tr>
                    <tr key={`${item.id}-sets`}>
                      <td colSpan={WORKOUT_COLUMNS.length} style={{ paddingLeft: 150 }}>
                        <TableWrapper columns={['Set ID', 'Order', 'Duration (seconds)', 'Reps', 'Weight', 'Weight Relative?', 'Archived?', 'Created At']}>
                          {orderBy(item.exerciseSets, set => parseInt(`${set.order}`), 'asc').map(set => (
                            <tr key={set.id}>
                              <td>{set.id}</td>
                              <td>
                                <EditText style={{ minWidth: 75 }} type='number' defaultValue={String(set.order)} onSave={({ value }) => modifyExerciseSetField('order', set.id)(parseInt(value))} />
                              </td>
                              <td>
                                <EditText style={{ minWidth: 75 }} type='number' defaultValue={String(set.durationSeconds)} onSave={({ value }) => modifyExerciseSetField('durationSeconds', set.id)(parseInt(value))} />
                              </td>
                              <td>
                                <EditText style={{ minWidth: 75 }} type='number' defaultValue={String(set.repCount)} onSave={({ value }) => modifyExerciseSetField('repCount', set.id)(parseInt(value))} />
                              </td>
                              <td>
                                <EditText style={{ minWidth: 75 }} type='number' defaultValue={String(set.weight)} onSave={({ value }) => modifyExerciseSetField('weight', set.id)(parseFloat(value))} />
                              </td>
                              <td>
                                <AppInput
                                  type={InputType.TOGGLE} defaultValue={set.weightRelative}
                                  onChange={modifyExerciseSetField('weightRelative', set.id)} />
                              </td>
                              <td>
                                <AppInput
                                  type={InputType.TOGGLE} defaultValue={set.archived}
                                  onChange={modifyExerciseSetField('archived', set.id)} />
                              </td>
                              <td>{formatDate(item.createdAt)}</td>
                            </tr>
                          ))}
                        </TableWrapper>
                        <Button style={{ width: '100%' }} size='sm' onClick={onCreateExerciseSet(circuit.id, item.id)}>Add New Exercise Set</Button>
                      </td>
                    </tr>
                  </>
                )
              })}
          </tbody>
        </TableWrapper>
        <Button style={{ width: '100%' }} size='sm' onClick={onCreateExercise(circuit.id)}>Add New Exercise</Button>
      </Card>
    )
  })


  return (
    <>
      <PageHeader title={`${workout?.name} - ${workout?.skillLevel} (${workout?.programFacet.program.name} ${workout?.programFacet.name})`} subtitle={`Workout Exercises`} />
      {sections}

      <hr />
      <h4>Add New Circuit</h4>
      <Row>
        <Col md={3}>
          <AppInput type={InputType.TEXT} value={circuitInput.name} onChange={changeCircuit('name')} label='Name*' />
        </Col>
        <Col md={2}>
          <AppInput type={InputType.NUMBER} value={circuitInput.order} onChange={changeCircuit('order')} label='Order*' />
        </Col>
      </Row>
      <Button variant='success' style={{ width: '100%', marginBottom: 30 }} onClick={onCreateCircuit}>Create</Button>
    </>
  )
}
