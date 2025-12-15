import { useAuth } from '@clerk/clerk-react'

export function useApi() {
  const { getToken } = useAuth()

  const api = async <T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> => {
    const token = await getToken()

    const baseUrl = (
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:5125/api/'
    ).replace(/\/$/, '')
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${baseUrl}${cleanEndpoint}`

    console.log('API Request:', { url, token: token ? 'present' : 'missing' }) // Debug

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return response.json()
  }

  return { api }
}
