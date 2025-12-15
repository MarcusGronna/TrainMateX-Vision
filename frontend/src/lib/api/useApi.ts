import { useAuth } from '@clerk/clerk-react'

export function useApi() {
  const { getToken } = useAuth()

  return async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken()
    if (!token) throw new Error('Missing auth token')

    const url = `${import.meta.env.VITE_API_BASE_URL}${endpoint}`
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const msg = await res.text()
      throw new Error(msg || `Request failed with status ${res.status}`)
    }

    // Handle 204 No Content - don't try to parse JSON
    if (res.status === 204) {
      return undefined
    }

    // Handle empty response body
    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return undefined
    }

    const text = await res.text()
    if (!text) {
      return undefined
    }

    try {
      return JSON.parse(text)
    } catch {
      return undefined
    }
  }
}
