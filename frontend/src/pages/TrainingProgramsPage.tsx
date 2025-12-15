import type { TrainingProgram } from '@/types/TrainingProgram'
import { humanizeEnum } from '@/lib/humanizeEnum'
import { useApi } from '@/lib/api/useApi'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import type { CreateTrainingProgramInput } from '@/types/CreateTrainingProgramInput'

const TRAINING_PROGRAMS_QUERY_KEY = ['trainingPrograms'] as const

export function TrainingProgramsPage() {
  const { api } = useApi()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    'beginner',
  )

  // Fetch training programs
  const {
    data: programs = [],
    isPending,
    isError,
    error,
  } = useQuery<TrainingProgram[], Error>({
    queryKey: TRAINING_PROGRAMS_QUERY_KEY,
    queryFn: () => api<TrainingProgram[]>('trainingprograms'),
  })

  useEffect(() => {
    if (isError && error) toast.error(error.message)
  }, [isError, error])

  // Create training program mutation
  const createProgramMutation = useMutation<
    TrainingProgram,
    Error,
    CreateTrainingProgramInput
  >({
    mutationFn: async (input) => {
      const requestPromise = api<TrainingProgram>('trainingprograms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

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
    onSuccess: async (newProgram) => {
      await queryClient.invalidateQueries({
        queryKey: TRAINING_PROGRAMS_QUERY_KEY,
      })

      setIsCreateOpen(false)
      setName('')
      setDescription('')
      setLevel('beginner')

      navigate({
        to: '/programs/$programId',
        params: { programId: newProgram.id },
      })
    },
  })

  const handleCreateProgram = (e: FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.warn('Program name is required')
      return
    }

    createProgramMutation.mutate({
      name: trimmedName,
      description: description.trim() || undefined,
      level,
    })
  }

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            Training Programs
          </h1>
          <p className="text-sm text-gray-600">
            Manage your workout programs and routines
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create Program
        </button>
      </div>

      {isPending ? (
        <p className="text-sm text-gray-600">Loading programs...</p>
      ) : programs.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <p className="text-gray-600">
            No training programs yet. Create your first one!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <button
              key={program.id}
              onClick={() =>
                navigate({
                  to: '/programs/$programId',
                  params: { programId: program.id },
                })
              }
              className="rounded-xl border bg-white p-4 text-left hover:border-indigo-600 hover:shadow-md transition-all"
            >
              <h3 className="font-semibold text-gray-900">{program.name}</h3>
              {program.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {program.description}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Level: {humanizeEnum(program.level)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Created: {new Date(program.createdAt).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Create Program Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Training Program
              </h3>
              <button
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => setIsCreateOpen(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., 5x5 Strength Program"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Level
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={level}
                  onChange={(e) =>
                    setLevel(
                      e.target.value as
                        | 'beginner'
                        | 'intermediate'
                        | 'advanced',
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
                className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700"
                disabled={createProgramMutation.isPending}
              >
                {createProgramMutation.isPending
                  ? 'Creating...'
                  : 'Create Program'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
