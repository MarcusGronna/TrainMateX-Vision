export type WorkoutExercise = {
  id: string
  workoutId: string
  exerciseId: string
  exerciseName: string
  sets: number
  reps: number
  weight?: number | null
  notes?: string | null
  createdAt: string
}

export type CreateWorkoutExerciseInput = {
  exerciseId: string
  sets: number
  reps: number
  weight?: number
  notes?: string
}
