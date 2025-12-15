import type {
  TrainingProgram,
  UpdateTrainingProgramInput,
} from '@/types/TrainingProgram'
import type { Workout, CreateWorkoutInput } from '@/types/Workout'
import { humanizeEnum } from '@/lib/humanizeEnum'
import { useApi } from '@/lib/api/useApi'
import { programsKeys } from '@/features/programs/keys'
import { workoutsKeys } from '@/features/workouts/keys'
import { BackLink } from '@/components/BackLink'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProgramForm } from '@/features/programs/components/ProgramForm'
import { WorkoutForm } from '@/features/workouts/components/WorkoutForm'
import { useUndoableDelete } from '@/hooks/useUndoableDelete'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { toast } from 'react-toastify'

export function ProgramDetailPage() {
  const { programId } = useParams({ from: '/programs/$programId' })
  const { api } = useApi()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Modal states
  const [isEditProgramOpen, setIsEditProgramOpen] = useState(false)
  const [isCreateWorkoutOpen, setIsCreateWorkoutOpen] = useState(false)
  const [isEditWorkoutOpen, setIsEditWorkoutOpen] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)

  // Confirm delete states
  const [isDeleteProgramDialogOpen, setIsDeleteProgramDialogOpen] =
    useState(false)
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null)

  // Fetch single program
  const {
    data: program,
    isPending: isProgramLoading,
    isError: isProgramError,
    error: programError,
  } = useQuery<TrainingProgram, Error>({
    queryKey: programsKeys.byId(programId),
    queryFn: async () => {
      const result = await api<TrainingProgram>(`trainingprograms/${programId}`)
      if (!result) throw new Error('Program not found')
      return result
    },
  })

  useEffect(() => {
    if (isProgramError && programError) toast.error(programError.message)
  }, [isProgramError, programError])

  // Fetch workouts for this program
  const {
    data: workouts = [],
    isPending: isWorkoutsLoading,
    isError: isWorkoutsError,
    error: workoutsError,
  } = useQuery<Workout[], Error>({
    queryKey: workoutsKeys.list(programId),
    queryFn: async () => {
      const result = await api<Workout[]>(
        `trainingprograms/${programId}/workouts`,
      )
      return result ?? []
    },
  })

  useEffect(() => {
    if (isWorkoutsError && workoutsError) toast.error(workoutsError.message)
  }, [isWorkoutsError, workoutsError])

  // CREATE workout mutation
  const createWorkoutMutation = useMutation<Workout, Error, CreateWorkoutInput>(
    {
      mutationFn: async (input) => {
        const requestPromise = api<Workout>(
          `trainingprograms/${programId}/workouts`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          },
        )

        const result = await toast.promise(requestPromise, {
          pending: 'Creating workout...',
          success: 'Workout created',
          error: {
            render({ data }) {
              const e = data as Error | undefined
              return e?.message ?? 'Failed to create workout'
            },
          },
        })

        if (!result) throw new Error('Failed to create workout')
        return result
      },
      onSuccess: async (newWorkout) => {
        await queryClient.invalidateQueries({
          queryKey: workoutsKeys.list(programId),
        })

        setIsCreateWorkoutOpen(false)

        navigate({
          to: '/programs/$programId/workouts/$workoutId',
          params: { programId, workoutId: newWorkout.id },
        })
      },
    },
  )

  // UPDATE program mutation
  const updateProgramMutation = useMutation<
    TrainingProgram,
    Error,
    UpdateTrainingProgramInput
  >({
    mutationFn: async (input) => {
      const requestPromise = api<TrainingProgram>(
        `trainingprograms/${programId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      )

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
      await queryClient.invalidateQueries({
        queryKey: programsKeys.list(),
      })
      await queryClient.invalidateQueries({
        queryKey: programsKeys.byId(programId),
      })

      setIsEditProgramOpen(false)
    },
  })

  // DELETE program mutation
  const deleteProgramMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
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
      setIsDeleteProgramDialogOpen(false)
      navigate({ to: '/' })
    },
  })

  // UPDATE workout mutation
  const updateWorkoutMutation = useMutation<
    Workout,
    Error,
    { workoutId: string; input: CreateWorkoutInput }
  >({
    mutationFn: async ({ workoutId, input }) => {
      const requestPromise = api<Workout>(
        `trainingprograms/${programId}/workouts/${workoutId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      )

      const result = await toast.promise(requestPromise, {
        pending: 'Updating workout...',
        success: 'Workout updated',
        error: {
          render({ data }) {
            const e = data as Error | undefined
            return e?.message ?? 'Failed to update workout'
          },
        },
      })

      if (!result) throw new Error('Failed to update workout')
      return result
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workoutsKeys.list(programId),
      })

      setIsEditWorkoutOpen(false)
      setEditingWorkout(null)
    },
  })

  // DELETE workout mutation
  const deleteWorkoutMutation = useMutation<void, Error, string>({
    mutationFn: async (workoutId) => {
      const requestPromise = api(
        `trainingprograms/${programId}/workouts/${workoutId}`,
        { method: 'DELETE' },
      )

      await toast.promise(requestPromise, {
        pending: 'Deleting workout...',
        success: 'Workout deleted',
        error: {
          render({ data }) {
            const e = data as Error | undefined
            return e?.message ?? 'Failed to delete workout'
          },
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workoutsKeys.list(programId),
      })
      setWorkoutToDelete(null)
    },
  })

  // DELETE program with optimistic undo - hook called at top level
  const executeDeleteProgram = useUndoableDelete<
    TrainingProgram[],
    TrainingProgram
  >({
    queryKey: programsKeys.list(),
    deleteFn: () => deleteProgramMutation.mutateAsync(),
    optimisticUpdate: (old) => old?.filter((p) => p.id !== programId) ?? [],
    getItemLabel: () => program?.name || 'program',
  })

  // DELETE workout with optimistic undo - hook called at top level
  const executeDeleteWorkout = useUndoableDelete<Workout[], Workout>({
    queryKey: workoutsKeys.list(programId),
    deleteFn: (workout) => deleteWorkoutMutation.mutateAsync(workout.id),
    optimisticUpdate: (old, workout) =>
      old?.filter((w) => w.id !== workout.id) ?? [],
    getItemLabel: (workout) => workout.name,
  })

  // Handlers
  const handleCreateWorkout = (values: CreateWorkoutInput) => {
    if (!values.name.trim()) {
      toast.warn('Workout name is required')
      return
    }

    createWorkoutMutation.mutate(values)
  }

  const handleEditProgram = (values: UpdateTrainingProgramInput) => {
    if (!values.name.trim()) {
      toast.warn('Program name is required')
      return
    }

    updateProgramMutation.mutate(values)
  }

  const handleDeleteProgram = () => {
    if (program) {
      executeDeleteProgram(program)
    }
  }

  const handleEditWorkout = (values: CreateWorkoutInput) => {
    if (!editingWorkout) return

    if (!values.name.trim()) {
      toast.warn('Workout name is required')
      return
    }

    updateWorkoutMutation.mutate({
      workoutId: editingWorkout.id,
      input: values,
    })
  }

  const handleDeleteWorkout = (workout: Workout) => {
    executeDeleteWorkout(workout)
  }

  const openEditWorkoutModal = (workout: Workout) => {
    setEditingWorkout(workout)
    setIsEditWorkoutOpen(true)
  }

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      {/* Header with Edit/Delete Program buttons */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            {program?.name ?? (isProgramLoading ? 'Loading...' : 'Unknown')}
          </h1>
          {program?.description && (
            <p className="text-sm text-gray-600">{program.description}</p>
          )}
          {program && (
            <p className="text-xs text-gray-500">
              Level: {humanizeEnum(program.level)}
            </p>
          )}
          {/* This is correct, don't touch */}
          <BackLink to="/" label="Back to Programs" />
        </div>

        {program && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditProgramOpen(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={() => setIsDeleteProgramDialogOpen(true)}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Add Workout Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreateWorkoutOpen(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add Workout
        </button>
      </div>

      {/* Workouts List */}
      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Workouts</h2>

        {isWorkoutsLoading ? (
          <p className="text-sm text-gray-600">Loading workouts...</p>
        ) : workouts.length === 0 ? (
          <p className="text-sm text-gray-600">
            No workouts yet. Add your first one!
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {workouts.map((workout) => (
              <li key={workout.id}>
                <Link
                  to="/programs/$programId/workouts/$workoutId"
                  params={{ programId, workoutId: workout.id }}
                  className="block p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {workout.name}
                      </p>
                      {workout.dayOfWeek && (
                        <p className="text-sm text-gray-600">
                          {workout.dayOfWeek}
                        </p>
                      )}
                      {workout.notes && (
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                          {workout.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          openEditWorkoutModal(workout)
                        }}
                        className="text-xs rounded-md bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDeleteWorkout(workout)
                        }}
                        className="text-xs rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Create Workout Modal */}
      <Modal
        isOpen={isCreateWorkoutOpen}
        onClose={() => setIsCreateWorkoutOpen(false)}
        title="Add Workout"
      >
        <WorkoutForm
          submitLabel="Create Workout"
          isSubmitting={createWorkoutMutation.isPending}
          onSubmit={handleCreateWorkout}
          onCancel={() => setIsCreateWorkoutOpen(false)}
        />
      </Modal>

      {/* Edit Program Modal */}
      <Modal
        isOpen={isEditProgramOpen}
        onClose={() => setIsEditProgramOpen(false)}
        title="Edit Program"
      >
        <ProgramForm
          defaultValues={
            program
              ? {
                  name: program.name,
                  description: program.description ?? undefined,
                  level: (program.level ?? 'beginner') as
                    | 'beginner'
                    | 'intermediate'
                    | 'advanced',
                }
              : undefined
          }
          submitLabel="Update Program"
          isSubmitting={updateProgramMutation.isPending}
          onSubmit={handleEditProgram}
          onCancel={() => setIsEditProgramOpen(false)}
        />
      </Modal>

      {/* Edit Workout Modal */}
      <Modal
        isOpen={isEditWorkoutOpen}
        onClose={() => setIsEditWorkoutOpen(false)}
        title="Edit Workout"
      >
        <WorkoutForm
          defaultValues={
            editingWorkout
              ? {
                  name: editingWorkout.name,
                  dayOfWeek: editingWorkout.dayOfWeek ?? undefined,
                  notes: editingWorkout.notes ?? undefined,
                }
              : undefined
          }
          submitLabel="Update Workout"
          isSubmitting={updateWorkoutMutation.isPending}
          onSubmit={handleEditWorkout}
          onCancel={() => setIsEditWorkoutOpen(false)}
        />
      </Modal>

      {/* Confirm Delete Program Dialog */}
      <ConfirmDialog
        isOpen={isDeleteProgramDialogOpen}
        onClose={() => setIsDeleteProgramDialogOpen(false)}
        onConfirm={handleDeleteProgram}
        title="Delete Program"
        description={`Are you sure you want to delete "${program?.name}"? This will also delete all workouts. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />

      {/* Confirm Delete Workout Dialog */}
      <ConfirmDialog
        isOpen={!!workoutToDelete}
        onClose={() => setWorkoutToDelete(null)}
        onConfirm={() =>
          workoutToDelete && handleDeleteWorkout(workoutToDelete)
        }
        title="Delete Workout"
        description={`Are you sure you want to delete workout "${workoutToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  )
}
