export type Workout = {
  id: string
  trainingProgramId: string
  name: string
  dayOfWeek?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  description: string // Add this line
}

export type CreateWorkoutInput = {
  name: string
  dayOfWeek?: string
  notes?: string
}

export type UpdateWorkoutInput = {
  name: string
  dayOfWeek?: string
  notes?: string
}
