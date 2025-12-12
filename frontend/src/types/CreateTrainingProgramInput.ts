export type CreateTrainingProgramInput = {
  name: string
  description?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
}

export type UpdateTrainingProgramInput = {
  name: string
  description?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
}
