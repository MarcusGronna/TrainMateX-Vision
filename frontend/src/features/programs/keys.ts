/**
 * Query key factory for training programs.
 * Provides consistent, type-safe query keys for all program-related queries.
 */
export const programsKeys = {
  /**
   * Base key for all program queries
   */
  all: ['programs'] as const,

  /**
   * Key for list of all programs
   */
  list: () => [...programsKeys.all] as const,

  /**
   * Key for a single program by ID
   */
  byId: (programId: string) => [...programsKeys.all, programId] as const,
}
