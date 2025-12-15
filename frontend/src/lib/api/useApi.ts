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
   * For GET requests that return data, use api<T>().
   * For DELETE/PUT that return 204, the result will be undefined.
   */
  async function api<T>(path: string, init?: RequestInit): Promise<T> {
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

    // Handle 204 No Content or empty responses
    if (
      response.status === 204 ||
      response.headers.get('content-length') === '0'
    ) {
      return undefined as T
    }

    // Check if there's actually content to parse
    const text = await response.text()
    if (!text) {
      return undefined as T
    }

    // Parse JSON response
    return JSON.parse(text) as T
  }

  return { api }
}
