/**
 * Query key factory for workouts.
 * Provides consistent, type-safe query keys for all workout-related queries.
 */
export const workoutsKeys = {
  /**
   * Base key for all workout queries
   */
  all: ['workouts'] as const,

  /**
   * Key for workouts list scoped to a specific program
   */
  list: (programId: string) => [...workoutsKeys.all, programId] as const,

  /**
   * Key for a single workout by program and workout ID
   */
  byId: (programId: string, workoutId: string) =>
    [...workoutsKeys.all, programId, workoutId] as const,
}