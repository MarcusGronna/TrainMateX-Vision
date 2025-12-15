import type { TrainingProgram } from '@/types/TrainingProgram'
import { humanizeEnum } from '@/lib/humanizeEnum'
import { useApi } from '@/lib/api/useApi'
import { programsKeys } from '@/features/programs/keys'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import type { Id } from 'react-toastify'

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

  // Confirm delete state
  const [programToDelete, setProgramToDelete] =
    useState<TrainingProgram | null>(null)

  // Fetch training programs
  const {
    data: programs = [],
    isPending,
    isError,
    error,
  } = useQuery<TrainingProgram[], Error>({
    queryKey: programsKeys.list(),
    queryFn: async () => {
      const result = await api<TrainingProgram[]>('trainingprograms')
      return result ?? []
    },
  })

  useEffect(() => {
    if (isError && error) toast.error(error.message)
  }, [isError, error])

  // Create training program mutation
  const createProgramMutation = useMutation<TrainingProgram, Error>({
    mutationFn: async (input) => {
      const requestPromise = api<TrainingProgram>('trainingprograms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const result = await toast.promise(requestPromise, {
        pending: 'Creating program...',
        success: 'Program created successfully',
        error: {
          render({ data }) {
            const e = data as Error | undefined
            return e?.message ?? 'Failed to create program'
          },
        },
      })

      if (!result) throw new Error('Failed to create program')
      return result
    },
    onSuccess: async (newProgram) => {
      await queryClient.invalidateQueries({
        queryKey: programsKeys.list(),
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

  // DELETE program mutation (with optimistic undo)
  const deleteProgramMutation = useMutation<void, Error, string>({
    mutationFn: async (programId) => {
      const requestPromise = api(`trainingprograms/${programId}`, {
        method: 'DELETE',
      })

      await toast.promise(requestPromise, {
        pending: 'Deleting program...',
        success: 'Program deleted',
        error: {
          render({ data }) {
            const e = data as Error | undefined
            return e?.message ?? 'Failed to delete program'
          },
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: programsKeys.list(),
      })
      setProgramToDelete(null)
    },
  })

  const handleCreateProgram = (e: FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.warn('Program name is required')
      return
    }
  }

  const handleDeleteProgram = (program: TrainingProgram) => {
    // Store previous data for rollback
    const previousPrograms = queryClient.getQueryData<TrainingProgram[]>(
      programsKeys.list(),
    )

    // Optimistically remove from cache
    queryClient.setQueryData<TrainingProgram[]>(
      programsKeys.list(),
      (old) => old?.filter((p) => p.id !== program.id) ?? [],
    )

    let timeoutId: NodeJS.Timeout | null = null
    let toastId: Id | null = null
    let isUndone = false

    // Show undo toast
    toastId = toast.info(
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-gray-700">
          Deleted <strong>{program.name}</strong>
        </span>
        <button
          onClick={() => {
            isUndone = true
            if (timeoutId) clearTimeout(timeoutId)
            if (toastId) toast.dismiss(toastId)

            // Rollback optimistic update
            queryClient.setQueryData(programsKeys.list(), previousPrograms)

            toast.success('Undo successful')
          }}
          className="shrink-0 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          Undo
        </button>
      </div>,
      {
        autoClose: 5000,
        closeButton: false,
        onClose: () => {
          if (timeoutId) clearTimeout(timeoutId)
        },
      },
    )

    // Execute actual deletion after delay
    timeoutId = setTimeout(() => {
      if (!isUndone) {
        deleteProgramMutation.mutate(program.id, {
          onError: () => {
            // Rollback on error
            queryClient.setQueryData(programsKeys.list(), previousPrograms)
          },
        })
      }
    }, 5000)
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
            <div
              key={program.id}
              className="rounded-xl border bg-white p-4 hover:border-indigo-600 hover:shadow-md transition-all"
            >
              <button
                onClick={() =>
                  navigate({
                    to: '/programs/$programId',
                    params: { programId: program.id },
                  })
                }
                className="w-full text-left"
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

              <div className="mt-3 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate({
                      to: '/programs/$programId',
                      params: { programId: program.id },
                    })
                  }}
                  className="flex-1 text-xs rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
                >
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setProgramToDelete(program)
                  }}
                  className="flex-1 text-xs rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Program Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Training Program"
      >
        <form onSubmit={handleCreateProgram} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Name *</label>
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
            <label className="text-sm font-medium text-gray-700">Level</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2"
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
            className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700"
            disabled={createProgramMutation.isPending}
          >
            {createProgramMutation.isPending ? 'Creating...' : 'Create Program'}
          </button>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!programToDelete}
        onClose={() => setProgramToDelete(null)}
        onConfirm={() =>
          programToDelete && handleDeleteProgram(programToDelete)
        }
        title="Delete Program"
        description={`Are you sure you want to delete "${programToDelete?.name}"? This will also delete all workouts. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  )
}
