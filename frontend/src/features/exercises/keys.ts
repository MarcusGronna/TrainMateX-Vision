/**
 * Query key factory for exercises.
 * Provides consistent, type-safe query keys for all exercise-related queries.
 */

interface ExerciseFilters {
  muscleGroup?: string
  equipment?: string
  difficulty?: string
}

export const exercisesKeys = {
  /**
   * Base key for all exercise queries
   */
  all: ['exercises'] as const,

  /**
   * Key for exercises list with optional filters
   */
  list: (filters?: ExerciseFilters) => {
    if (!filters) {
      return [...exercisesKeys.all] as const
    }

    // Create a stable filter object by only including defined values
    const stableFilters: ExerciseFilters = {}
    if (filters.muscleGroup) stableFilters.muscleGroup = filters.muscleGroup
    if (filters.equipment) stableFilters.equipment = filters.equipment
    if (filters.difficulty) stableFilters.difficulty = filters.difficulty

    return [...exercisesKeys.all, stableFilters] as const
  },
}