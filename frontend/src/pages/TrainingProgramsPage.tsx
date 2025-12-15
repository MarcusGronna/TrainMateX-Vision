import type { TrainingProgram } from '@/types/TrainingProgram'
import type { CreateTrainingProgramInput } from '@/types/CreateTrainingProgramInput'
import type { Workout } from '@/types/Workout'
import { humanizeEnum } from '@/lib/humanizeEnum'
import { useApi } from '@/lib/api/useApi'
import { programsKeys } from '@/features/programs/keys'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProgramForm } from '@/features/programs/components/ProgramForm'
import { useUndoableDelete } from '@/hooks/useUndoableDelete'
import {
  Card,
  CardDescription,
  CardFooter,
  CardTitle,
} from '@/components/ui/Card'
import { SectionTitle } from '@/components/ui/SectionTitle'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

export function TrainingProgramsPage() {
  const { api } = useApi()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
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
      navigate({
        to: '/programs/$programId',
        params: { programId: newProgram.id },
      })
    },
  })

  // DELETE program mutation
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

  const handleCreateProgram = (values: CreateTrainingProgramInput) => {
    if (!values.name.trim()) {
      toast.warn('Program name is required')
      return
    }

    createProgramMutation.mutate({
      name: values.name,
      description: values.description || undefined,
      level: values.level,
    })
  }

  // DELETE program with optimistic undo - hook called at top level
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

  const handleDeleteProgram = (program: TrainingProgram) => {
    executeDeleteProgram(program)
  }

  const {
    data: workout,
    isPending: isWorkoutLoading,
    isError: isWorkoutError,
    error: workoutError,
  } = useQuery<Workout, Error>({
    queryKey: workoutsKeys.byId(programId, workoutId),
    queryFn: async () => {
      const result = await api<Workout>(
        `trainingprograms/${programId}/workouts/${workoutId}`,
      )
      if (!result) throw new Error('Workout not found')
      return result
    },
  })

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <SectionTitle
        description="Manage your workout programs and routines"
        action={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create Program
          </button>
        }
      >
        Training Programs
      </SectionTitle>

      {isPending ? (
        <p className="text-sm text-gray-600">Loading programs...</p>
      ) : programs.length === 0 ? (
        <Card>
          <p className="text-center text-gray-600">
            No training programs yet. Create your first one!
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Card key={program.id} clickable>
              <button
                onClick={() =>
                  navigate({
                    to: '/programs/$programId',
                    params: { programId: program.id },
                  })
                }
                className="w-full text-left"
              >
                <CardTitle>{program.name}</CardTitle>
                {program.description && (
                  <CardDescription className="mt-1 line-clamp-2">
                    {program.description}
                  </CardDescription>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Level: {humanizeEnum(program.level)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Created: {new Date(program.createdAt).toLocaleDateString()}
                </p>
              </button>

              <CardFooter>
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
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

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
