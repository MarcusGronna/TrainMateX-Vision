export interface Exercise {
  id: string
  name: string
  description: string
  muscleGroup: MuscleGroup
  equipment: Equipment
  difficulty: Difficulty
  videoUrl?: string
  thumbnailUrl?: string
}

export type MuscleGroup =
  | 'CHEST'
  | 'BACK'
  | 'SHOULDERS'
  | 'LEGS'
  | 'ARMS'
  | 'CORE'
  | 'FULL_BODY'
  | 'CARDIO'

export type Equipment =
  | 'BARBELL'
  | 'DUMBBELL'
  | 'MACHINE'
  | 'CABLE'
  | 'BODYWEIGHT'
  | 'KETTLEBELL'
  | 'RESISTANCE_BAND'
  | 'OTHER'

export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
