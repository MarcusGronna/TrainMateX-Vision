import { useAuth } from '@clerk/clerk-react'
import { useEffect, useState, type FormEvent } from 'react'

type TrainingProgram = {
  id: string
  name: string
  description?: string | null
  level?: string | null
  createdAt: string
}

export function TrainingProgramsPage() {
  const { getToken } = useAuth()

  const [programs, setPrograms] = useState<TrainingProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = await getToken()

        if (!token) {
          setError('No auth token available')
          setLoading(false)
          return
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}trainingprograms`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data: TrainingProgram[] = await response.json()
        setPrograms(data)
      } catch (err: any) {
        setError(err.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [getToken])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    try {
      setError(null)

      const token = await getToken()
      if (!token) {
        setError('No auth token available')
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}trainingprograms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            description: description || null,
            level: 'beginner',
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Create failed with status ${response.status}`)
      }

      const created: TrainingProgram = await response.json()

      setPrograms((prev) => [created, ...prev])

      setName('')
      setDescription('')
    } catch (err: any) {
      setError(err.message ?? 'Unknown error when creating program')
    }
  }

  if (loading) {
    return <p>Loading traing programs...</p>
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      {/* Titel */}
      <h1 className="text-2xl font-semibold text-gray-900">
        My Training Programs
      </h1>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-md bg-red-100 border border-red-300 text-red-700">
          Error: {error}
        </div>
      )}

      {/* Skapa nytt program */}
      <form
        onSubmit={handleCreate}
        className="space-y-4 bg-white p-4 rounded-xl shadow-sm border"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Beginner Full Body Plan"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description..."
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
        >
          Create Program
        </button>
      </form>

      {/* Lista av program */}
      {programs.length === 0 ? (
        <p className="text-gray-600 text-center">No training programs yet.</p>
      ) : (
        <ul className="space-y-3">
          {programs.map((p) => (
            <li
              key={p.id}
              className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{p.name}</h2>
                {p.level && (
                  <span className="text-sm text-gray-500">{p.level}</span>
                )}
              </div>

              {p.description && (
                <p className="text-sm text-gray-700 mt-1">{p.description}</p>
              )}

              <p className="text-xs text-gray-400 mt-2">
                Created: {new Date(p.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
