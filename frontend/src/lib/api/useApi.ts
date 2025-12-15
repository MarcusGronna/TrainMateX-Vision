import { useAuth } from '@clerk/clerk-react'

export function useApi() {
  const { getToken, isSignedIn } = useAuth()

  const api = async <T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> => {
    if (!isSignedIn) {
      throw new Error('User is not authenticated')
    }

    // Force token refresh to ensure it's not expired
    const token = await getToken({ skipCache: true })

    if (!token) {
      throw new Error('Failed to get authentication token')
    }

    const baseUrl = (
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:5125/api/'
    ).replace(/\/$/, '')
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${baseUrl}${cleanEndpoint}`

    // console.log('API Request:', {
    //   url,
    //   token: 'present',
    //   timestamp: new Date().toISOString(),
    // })

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (response.status === 401) {
      throw new Error('Authentication failed. Please sign in again.')
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error ${response.status}: ${errorText}`)
    }

    return response.json()
  }

  return { api }
}
