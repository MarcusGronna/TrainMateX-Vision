export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'legs',
  'core',
] as const

export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'resistance_band',
] as const

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]
export type Equipment = (typeof EQUIPMENT)[number]
export type Difficulty = (typeof DIFFICULTIES)[number]
