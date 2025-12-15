export const Category = {
  Warmup: 'Warmup',
  Strength: 'Strength',
  Rehab: 'Rehab',
  Flexibility: 'Flexibility',
  Cardio: 'Cardio',
} as const

export const MuscleGroup = {
  Back: 'Back',
  Chest: 'Chest',
  Glutes: 'Glutes',
  Legs: 'Legs',
  Core: 'Core',
  Lats: 'Lats',
  Shoulders: 'Shoulders',
  Hamstrings: 'Hamstrings',
  Quads: 'Quads',
  Fullbody: 'Fullbody',
  Triceps: 'Triceps',
  Traps: 'Traps',
} as const

export const Equipment = {
  BodyWeight: 'BodyWeight',
  Dumbbell: 'Dumbbell',
  Barbell: 'Barbell',
  PullUpBar: 'PullUpBar',
  ResistanceBand: 'ResistanceBand',
  Machine: 'Machine',
  Kettlebell: 'Kettlebell',
  Cable: 'Cable',
} as const

export const Difficulty = {
  Beginner: 'Beginner',
  Intermediate: 'Intermediate',
  Advanced: 'Advanced',
} as const

export type Category = (typeof Category)[keyof typeof Category]
export type MuscleGroup = (typeof MuscleGroup)[keyof typeof MuscleGroup]
export type Equipment = (typeof Equipment)[keyof typeof Equipment]
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty]
