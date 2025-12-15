import type { TrainingProgram } from '@/types/TrainingProgram'
import type { CreateTrainingProgramInput } from '@/types/CreateTrainingProgramInput'
import { humanizeEnum } from '@/lib/humanizeEnum'
import { useApi } from '@/lib/api/useApi'
import { programsKeys } from '@/features/programs/keys'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProgramForm } from '@/features/programs/components/ProgramForm'
import { useUndoableDelete } from '@/hooks/useUndoableDelete'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'react-toastify'

export function TrainingProgramsPage() {
  const { api } = useApi()
  const queryClient = useQueryClient()

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(
    null,
  )

  // Confirm delete state
  const [programToDelete, setProgramToDelete] =
    useState<TrainingProgram | null>(null)

  // Fetch programs
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

  // CREATE mutation
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

      const result = await toast.promise(requestPromise, {
        pending: 'Creating program...',
        success: 'Program created',
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: programsKeys.list() })
      setIsCreateOpen(false)
    },
  })

  // UPDATE mutation
  const updateProgramMutation = useMutation<
    TrainingProgram,
    Error,
    { id: string; input: CreateTrainingProgramInput }
  >({
    mutationFn: async ({ id, input }) => {
      const requestPromise = api<TrainingProgram>(`trainingprograms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const result = await toast.promise(requestPromise, {
        pending: 'Updating program...',
        success: 'Program updated',
        error: {
          render({ data }) {
            const e = data as Error | undefined
            return e?.message ?? 'Failed to update program'
          },
        },
      })

      if (!result) throw new Error('Failed to update program')
      return result
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: programsKeys.list() })
      setIsEditOpen(false)
      setEditingProgram(null)
    },
  })

  // DELETE mutation
  const deleteProgramMutation = useMutation<void, Error, string>({
    mutationFn: async (programId) => {
      await api(`trainingprograms/${programId}`, { method: 'DELETE' })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: programsKeys.list() })
    },
  })

  // DELETE with optimistic undo - hook called at top level
  const executeDeleteProgram = useUndoableDelete<
    TrainingProgram[],
    TrainingProgram
  >({
    queryKey: programsKeys.list(),
    deleteFn: (program) => deleteProgramMutation.mutateAsync(program.id),
    optimisticUpdate: (old, program) =>
      old?.filter((p) => p.id !== program.id) ?? [],
    getItemLabel: (program) => program.name,
  })

  // Handlers
  const handleCreateProgram = (values: CreateTrainingProgramInput) => {
    if (!values.name.trim()) {
      toast.warn('Program name is required')
      return
    }

    createProgramMutation.mutate(values)
  }

  const handleEditProgram = (values: CreateTrainingProgramInput) => {
    if (!editingProgram) return

    if (!values.name.trim()) {
      toast.warn('Program name is required')
      return
    }

    updateProgramMutation.mutate({
      id: editingProgram.id,
      input: values,
    })
  }

  const handleDeleteProgram = (program: TrainingProgram) => {
    executeDeleteProgram(program)
  }

  const openEditModal = (program: TrainingProgram) => {
    setEditingProgram(program)
    setIsEditOpen(true)
  }

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Training Programs
        </h1>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create Program
        </button>
      </div>

      {/* Programs List */}
      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
        {isPending ? (
          <p className="text-sm text-gray-600">Loading programs...</p>
        ) : programs.length === 0 ? (
          <p className="text-sm text-gray-600">
            No training programs yet. Create your first one!
          </p>
        ) : (
          <ul className="space-y-3">
            {programs.map((program) => (
              <li key={program.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to="/programs/$programId"
                    params={{ programId: program.id }}
                    className="flex-1 min-w-0 hover:bg-gray-50 transition-colors rounded-md p-2 -m-2"
                  >
                    <p className="font-semibold text-gray-900">
                      {program.name}
                    </p>
                    {program.description && (
                      <p className="text-sm text-gray-700 mt-1">
                        {program.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Level: {humanizeEnum(program.level)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created:{' '}
                      {new Date(program.createdAt).toLocaleDateString()}
                    </p>
                  </Link>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(program)
                      }}
                      className="text-xs rounded-md bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setProgramToDelete(program)
                      }}
                      className="text-xs rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Create Program Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Training Program"
      >
        <ProgramForm
          submitLabel="Create Program"
          isSubmitting={createProgramMutation.isPending}
          onSubmit={handleCreateProgram}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* Edit Program Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Program"
      >
        <ProgramForm
          defaultValues={
            editingProgram
              ? {
                  name: editingProgram.name,
                  description: editingProgram.description ?? undefined,
                  level: editingProgram.level,
                }
              : undefined
          }
          submitLabel="Update Program"
          isSubmitting={updateProgramMutation.isPending}
          onSubmit={handleEditProgram}
          onCancel={() => setIsEditOpen(false)}
        />
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
