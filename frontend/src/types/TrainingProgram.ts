import type { Workout } from './Workout'

export interface TrainingProgram {
  id: string
  name: string
  description: string
  level: string
  workouts: Workout[]
  createdAt: string
  updatedAt: string
}

export interface CreateTrainingProgramInput {
  name: string
  description: string
}

export interface UpdateTrainingProgramInput {
  name?: string
  description?: string
}
