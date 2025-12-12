export type Workout = {
  id: string
  trainingProgramId: string
  name: string
  dayOfWeek?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type CreateWorkoutInput = {
  name: string
  dayOfWeek?: string
  notes?: string
}
