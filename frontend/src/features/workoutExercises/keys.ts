/**
 * Query key factory for workout exercises.
 * Provides consistent, type-safe query keys for all workout exercise-related queries.
 */
export const workoutExercisesKeys = {
  /**
   * Base key for all workout exercise queries
   */
  all: ['workoutExercises'] as const,

  /**
   * Key for workout exercises list scoped to a specific workout
   */
  list: (workoutId: string) =>
    [...workoutExercisesKeys.all, workoutId] as const,

  /**
   * Key for a single workout exercise by ID
   */
  byId: (workoutId: string, exerciseId: string) =>
    [...workoutExercisesKeys.all, workoutId, exerciseId] as const,
}
