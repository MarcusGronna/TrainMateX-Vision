import type { TrainingProgram } from '@/types/TrainingProgram'
import type { Workout } from '@/types/Workout'
import type { UpdateTrainingProgramInput } from '@/types/CreateTrainingProgramInput'
import type { CreateWorkoutInput } from '@/types/Workout'
import { humanizeEnum } from '@/lib/humanizeEnum'
import { BackLink } from '@/components/BackLink'
import { useApi } from '@/lib/api/useApi'
import { programsKeys } from '@/features/programs/keys'
import { workoutsKeys } from '@/features/workouts/keys'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import type { Id } from 'react-toastify'

export function ProgramDetailPage() {
  const { programId } = useParams({ from: '/programs/$programId' })
  const { api } = useApi()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Edit program modal state
  const [isEditProgramOpen, setIsEditProgramOpen] = useState(false)
  const [editProgramName, setEditProgramName] = useState('')
  const [editProgramDescription, setEditProgramDescription] = useState('')
  const [editProgramLevel, setEditProgramLevel] = useState<
    'beginner' | 'intermediate' | 'advanced'
  >('beginner')

  // Create workout state
  const [isCreateWorkoutOpen, setIsCreateWorkoutOpen] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('')
  const [notes, setNotes] = useState('')

  // Edit workout modal state
  const [isEditWorkoutOpen, setIsEditWorkoutOpen] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [editWorkoutName, setEditWorkoutName] = useState('')
  const [editDayOfWeek, setEditDayOfWeek] = useState('')
  const [editNotes, setEditNotes] = useState('')

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

  // Sync edit form with program data
  useEffect(() => {
    if (program) {
      setEditProgramName(program.name)
      setEditProgramDescription(program.description || '')
      setEditProgramLevel(
        (program.level || 'beginner') as
          | 'beginner'
          | 'intermediate'
          | 'advanced',
      )
    }
  }, [program])

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
  const createWorkoutMutation = useMutation<
    Workout,
    Error,
    { name: string; dayOfWeek?: string; notes?: string }
  >({
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
      setWorkoutName('')
      setDayOfWeek('')
      setNotes('')

      navigate({
        to: '/programs/$programId/workouts/$workoutId',
        params: { programId, workoutId: newWorkout.id },
      })
    },
  })

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

  // DELETE program mutation with optimistic update
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

  // DELETE workout mutation with optimistic update
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

  // Handlers
  const handleCreateWorkout = (e: FormEvent) => {
    e.preventDefault()

    const trimmedName = workoutName.trim()
    if (!trimmedName) {
      toast.warn('Workout name is required')
      return
    }

    createWorkoutMutation.mutate({
      name: trimmedName,
      dayOfWeek: dayOfWeek.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  const handleEditProgram = (e: FormEvent) => {
    e.preventDefault()

    const trimmedName = editProgramName.trim()
    if (!trimmedName) {
      toast.warn('Program name is required')
      return
    }

    updateProgramMutation.mutate({
      name: trimmedName,
      description: editProgramDescription.trim() || undefined,
      level: editProgramLevel,
    })
  }

  const handleDeleteProgram = () => {
    // Store previous data for rollback
    const previousPrograms = queryClient.getQueryData<TrainingProgram[]>(
      programsKeys.list(),
    )

    // Optimistically remove from cache
    queryClient.setQueryData<TrainingProgram[]>(
      programsKeys.list(),
      (old) => old?.filter((p) => p.id !== programId) ?? [],
    )

    let timeoutId: NodeJS.Timeout | null = null
    let toastId: Id | null = null
    let isUndone = false

    // Show undo toast
    toastId = toast.info(
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-gray-700">
          Deleted <strong>{program?.name || 'program'}</strong>
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
        deleteProgramMutation.mutate(undefined, {
          onError: () => {
            // Rollback on error
            queryClient.setQueryData(programsKeys.list(), previousPrograms)
          },
        })
      }
    }, 5000)
  }

  const handleEditWorkout = (e: FormEvent) => {
    e.preventDefault()

    if (!editingWorkout) return

    const trimmedName = editWorkoutName.trim()
    if (!trimmedName) {
      toast.warn('Workout name is required')
      return
    }

    updateWorkoutMutation.mutate({
      workoutId: editingWorkout.id,
      input: {
        name: trimmedName,
        dayOfWeek: editDayOfWeek.trim() || undefined,
        notes: editNotes.trim() || undefined,
      },
    })
  }

  const handleDeleteWorkout = (workout: Workout) => {
    // Store previous data for rollback
    const previousWorkouts = queryClient.getQueryData<Workout[]>(
      workoutsKeys.list(programId),
    )

    // Optimistically remove from cache
    queryClient.setQueryData<Workout[]>(
      workoutsKeys.list(programId),
      (old) => old?.filter((w) => w.id !== workout.id) ?? [],
    )

    let timeoutId: NodeJS.Timeout | null = null
    let toastId: Id | null = null
    let isUndone = false

    // Show undo toast
    toastId = toast.info(
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-gray-700">
          Deleted <strong>{workout.name}</strong>
        </span>
        <button
          onClick={() => {
            isUndone = true
            if (timeoutId) clearTimeout(timeoutId)
            if (toastId) toast.dismiss(toastId)

            // Rollback optimistic update
            queryClient.setQueryData(
              workoutsKeys.list(programId),
              previousWorkouts,
            )

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
        deleteWorkoutMutation.mutate(workout.id, {
          onError: () => {
            // Rollback on error
            queryClient.setQueryData(
              workoutsKeys.list(programId),
              previousWorkouts,
            )
          },
        })
      }
    }, 5000)
  }

  const openEditWorkoutModal = (workout: Workout) => {
    setEditingWorkout(workout)
    setEditWorkoutName(workout.name)
    setEditDayOfWeek(workout.dayOfWeek || '')
    setEditNotes(workout.notes || '')
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
          <ul className="space-y-3">
            {workouts.map((workout) => (
              <li key={workout.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to="/programs/$programId/workouts/$workoutId"
                    params={{ programId, workoutId: workout.id }}
                    className="flex-1 min-w-0 hover:bg-gray-50 transition-colors rounded-md p-2 -m-2"
                  >
                    <p className="font-semibold text-gray-900">
                      {workout.name}
                    </p>
                    {workout.dayOfWeek && (
                      <p className="text-sm text-gray-600">
                        {workout.dayOfWeek}
                      </p>
                    )}
                    {workout.notes && (
                      <p className="text-sm text-gray-700 mt-1">
                        {workout.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Created:{' '}
                      {new Date(workout.createdAt).toLocaleDateString()}
                    </p>
                  </Link>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditWorkoutModal(workout)
                      }}
                      className="text-xs rounded-md bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setWorkoutToDelete(workout)
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

      {/* Create Workout Modal */}
      <Modal
        isOpen={isCreateWorkoutOpen}
        onClose={() => setIsCreateWorkoutOpen(false)}
        title="Add Workout"
      >
        <form onSubmit={handleCreateWorkout} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Name *</label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g., Upper Body Day"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Day of Week
            </label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
            >
              <option value="">Select a day...</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700"
            disabled={createWorkoutMutation.isPending}
          >
            {createWorkoutMutation.isPending ? 'Creating...' : 'Create Workout'}
          </button>
        </form>
      </Modal>

      {/* Edit Program Modal */}
      <Modal
        isOpen={isEditProgramOpen}
        onClose={() => setIsEditProgramOpen(false)}
        title="Edit Program"
      >
        <form onSubmit={handleEditProgram} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={editProgramName}
              onChange={(e) => setEditProgramName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={editProgramDescription}
              onChange={(e) => setEditProgramDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Level</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={editProgramLevel}
              onChange={(e) =>
                setEditProgramLevel(
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
            disabled={updateProgramMutation.isPending}
          >
            {updateProgramMutation.isPending ? 'Updating...' : 'Update Program'}
          </button>
        </form>
      </Modal>

      {/* Edit Workout Modal */}
      <Modal
        isOpen={isEditWorkoutOpen}
        onClose={() => setIsEditWorkoutOpen(false)}
        title="Edit Workout"
      >
        <form onSubmit={handleEditWorkout} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={editWorkoutName}
              onChange={(e) => setEditWorkoutName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Day of week
            </label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={editDayOfWeek}
              onChange={(e) => setEditDayOfWeek(e.target.value)}
            >
              <option value="">Select a day...</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700"
            disabled={updateWorkoutMutation.isPending}
          >
            {updateWorkoutMutation.isPending ? 'Updating...' : 'Update Workout'}
          </button>
        </form>
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
