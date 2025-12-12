import type { CreateTrainingProgramInput } from '@/types/CreateTrainingProgramInput'
import type { TrainingProgram } from '@/types/TrainingProgram'
import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'

const TRAINING_PROGRAMS_QUERY_KEY = ['trainingprograms'] as const
const LAST_USED_PROGRAM_KEY = 'lastUsedProgramId'

export function TrainingProgramsPage() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  // Toggle visibility of form and programs list
  const [showForm, setShowForm] = useState(false)
  const [showPrograms, setShowPrograms] = useState(false)
  const [lastUsedProgramId, setLastUsedProgramId] = useState<string | null>(
    localStorage.getItem(LAST_USED_PROGRAM_KEY),
  )

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    'beginner',
  )

  const {
    data: programs = [],
    isPending,
    isError,
    error,
  } = useQuery<TrainingProgram[], Error>({
    queryKey: TRAINING_PROGRAMS_QUERY_KEY,
    queryFn: async () => {
      const token = await getToken()
      if (!token) {
        throw new Error('Missing auth token from Clerk')
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
        const message = await response.text()
        throw new Error(
          message ||
            `Failed to load training programs (status ${response.status})`,
        )
      }

      return (await response.json()) as TrainingProgram[]
    },
  })

  useEffect(() => {
    if (isError && error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load training programs'
      toast.error(message)
    }
  }, [isError, error])

  const createProgramMutation = useMutation<
    TrainingProgram,
    Error,
    CreateTrainingProgramInput
  >({
    mutationFn: async (input) => {
      const token = await getToken()
      if (!token) {
        throw new Error('Missing auth token from Clerk')
      }

      const requestPromise = (async () => {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}trainingprograms`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(input),
          },
        )

        if (!response.ok) {
          const message = await response.text()
          throw new Error(
            message || `Create failed with status ${response.status}`,
          )
        }

        return (await response.json()) as TrainingProgram
      })()

      return await toast.promise(requestPromise, {
        pending: 'Creating program...',
        success: 'Program created successfully',
        error: {
          render({ data }) {
            const e = data as Error | undefined
            return e?.message ?? 'Failed to create program'
          },
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: TRAINING_PROGRAMS_QUERY_KEY,
      })

      setName('')
      setDescription('')
      setLevel('beginner')
      setShowForm(false)
    },
  })

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.warn('Name is required')
      return
    }

    createProgramMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      level,
    })
  }

  // Track when a program is clicked
  const handleProgramClick = (programId: string) => {
    localStorage.setItem(LAST_USED_PROGRAM_KEY, programId)
    setLastUsedProgramId(programId)
  }

  // Find the last used program
  const lastProgram = lastUsedProgramId
    ? programs.find((p) => p.id === lastUsedProgramId)
    : null

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        My Training Programs
      </h1>

      {/* Last Used Program */}
      {!isPending && lastProgram && (
        <Link
          to="/programs/$programId"
          params={{ programId: lastProgram.id }}
          onClick={() => handleProgramClick(lastProgram.id)}
          className="block"
        >
          <div className="rounded-xl border-2 border-indigo-600 bg-indigo-50 p-4 shadow-sm hover:shadow-md transition cursor-pointer">
            <p className="text-xs font-semibold text-indigo-600 mb-2">
              LAST USED
            </p>
            <h2 className="text-xl font-semibold text-gray-900">
              {lastProgram.name}
            </h2>
            {lastProgram.description && (
              <p className="text-sm text-gray-700 mt-1">
                {lastProgram.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              {lastProgram.level && (
                <span className="text-sm text-gray-600">
                  {lastProgram.level}
                </span>
              )}
              <p className="text-xs text-gray-500">
                {new Date(lastProgram.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Button Controls */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-3 text-lg font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          {showForm ? '✕ Hide' : '+ New Program'}
        </button>

        <button
          onClick={() => setShowPrograms(!showPrograms)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700 transition-colors"
        >
          {showPrograms ? '✕ Hide Programs' : 'View Programs'}
        </button>
      </div>

      {/* Create Program Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 bg-white p-4 rounded-xl shadow-sm border max-w-xl"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My new training plan"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Level</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              value={level}
              onChange={(e) =>
                setLevel(
                  e.target.value as 'beginner' | 'intermediate' | 'advanced',
                )
              }
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
          >
            {createProgramMutation.isPending ? 'Creating...' : 'Create Program'}
          </button>
        </form>
      )}

      {/* Programs List */}
      {showPrograms && (
        <div className="space-y-4">
          {isPending ? (
            <p className="text-gray-600 text-center py-8">
              Loading training programs...
            </p>
          ) : isError ? (
            <p className="text-gray-600 text-center py-8">
              Could not load programs. Please try again.
            </p>
          ) : !programs || programs.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No training programs yet. Create one to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {programs.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/programs/$programId"
                    params={{ programId: p.id }}
                    onClick={() => handleProgramClick(p.id)}
                    className="block rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-gray-900">{p.name}</h2>
                      {p.level && (
                        <span className="text-sm text-gray-500">{p.level}</span>
                      )}
                    </div>

                    {p.description && (
                      <p className="text-sm text-gray-700 mt-1">
                        {p.description}
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      Created: {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
