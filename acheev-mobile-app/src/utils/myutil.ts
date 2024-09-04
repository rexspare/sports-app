const checkIfWorkoutCompleted = (workouts: any[], id: number) => {
    const exists = workouts?.find((x) => x.id == id)
    return exists ? true : false
}

export {
    checkIfWorkoutCompleted
}