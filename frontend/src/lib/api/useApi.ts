import { useAuth } from '@clerk/clerk-react'

/**
 * Centralized API client that handles:
 * - Clerk authentication (Bearer token)
 * - Error handling and response parsing
 * - 204 No Content handling
 */
export function useApi() {
  const { getToken } = useAuth()

  /**
   * Makes an authenticated API request to the backend.
   *
   * @param path - API path (e.g., 'exercises' or 'trainingprograms/123/workouts')
   * @param init - Fetch RequestInit options
   * @returns Parsed JSON response or undefined for 204 No Content
   * @throws Error with backend message or fallback message
   */
  async function api<T = unknown>(
    path: string,
    init?: RequestInit,
  ): Promise<T | undefined> {
    const token = await getToken()
    if (!token) {
      throw new Error('Missing auth token')
    }

    const url = `${import.meta.env.VITE_API_BASE_URL}${path}`

    const response = await fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`,
      },
    })

    // Handle errors
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Request failed (status ${response.status})`)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined
    }

    // Parse JSON response
    return (await response.json()) as T
  }

  return { api }
}
