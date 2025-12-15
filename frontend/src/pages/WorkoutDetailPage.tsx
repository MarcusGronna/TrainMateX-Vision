import type { Exercise } from '@/types/Exercise'
import type {
  CreateWorkoutExerciseInput,
  UpdateWorkoutExerciseInput,
  WorkoutExercise,
} from '@/types/WorkoutExercise'
import type { Workout, UpdateWorkoutInput } from '@/types/Workout'
import { humanizeEnum } from '@/lib/humanizeEnum'
import { ExerciseFilters } from '@/components/ExerciseFilters'
import { BackLink } from '@/components/BackLink'
import { useApi } from '@/lib/api/useApi'
import { workoutsKeys } from '@/features/workouts/keys'
import { exercisesKeys } from '@/features/exercises/keys'
import { workoutExercisesKeys } from '@/features/workoutExercises/keys'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { WorkoutForm } from '@/features/workouts/components/WorkoutForm'
import { WorkoutExerciseForm } from '@/features/workoutExercises/components/WorkoutExerciseForm'
import { useUndoableDelete } from '@/hooks/useUndoableDelete'

import { useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function WorkoutDetailPage() {
  const { programId, workoutId } = useParams({
    from: '/programs/$programId/workouts/$workoutId',
  })

  const { api } = useApi()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Toggle exercise library visibility (desktop only)
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false)

  // Confirm delete states
  const [isDeleteWorkoutDialogOpen, setIsDeleteWorkoutDialogOpen] =
    useState(false)
  const [workoutExerciseToDelete, setWorkoutExerciseToDelete] =
    useState<WorkoutExercise | null>(null)

  // ========== FETCH WORKOUT ==========
  // Fetch workouts and select the specific one
  const {
    data: workout,
    isPending: isWorkoutLoading,
    isError: isWorkoutError,
    error: workoutError,
  } = useQuery<Workout | undefined, Error>({
    queryKey: workoutsKeys.byId(programId, workoutId),
    queryFn: async () => {
      const result = await api<Workout[]>(
        `trainingprograms/${programId}/workouts`,
      )
      if (!result) throw new Error('Failed to fetch workouts')

      const workout = result.find((w) => w.id === workoutId)
      if (!workout) throw new Error('Workout not found')

      return workout
    },
    // Optional: Enable stale time to reduce refetches
    staleTime: 30_000, // 30 seconds
    retry: 1, // Retry once if workout not found
  })

  useEffect(() => {
    if (!isWorkoutLoading) {
      if (isWorkoutError && workoutError) {
        toast.error(workoutError.message)
      } else if (!workout) {
        toast.error('Workout not found')
        navigate({ to: '/programs/$programId', params: { programId } })
      }
    }
  }, [
    isWorkoutLoading,
    isWorkoutError,
    workout,
    workoutError,
    navigate,
    programId,
  ])

  // ========== FETCH EXERCISES (FOR LIBRARY) ==========
  const {
    data: exercises = [],
    isPending: isExercisesLoading,
    isError: isExercisesError,
    error: exercisesError,
  } = useQuery<Exercise[], Error>({
    queryKey: exercisesKeys.list(),
    queryFn: async () => {
      const result = await api<Exercise[]>('exercises')
      return result ?? []
    },
  })

  useEffect(() => {
    if (isExercisesError && exercisesError) toast.error(exercisesError.message)
  }, [isExercisesError, exercisesError])

  // ========== FETCH WORKOUT EXERCISES ==========
  const {
    data: workoutExercises = [],
    isPending: isWorkoutExercisesLoading,
    isError: isWorkoutExercisesError,
    error: workoutExercisesError,
  } = useQuery<WorkoutExercise[], Error>({
    queryKey: workoutExercisesKeys.list(workoutId),
    queryFn: async () => {
      const result = await api<WorkoutExercise[]>(
        `workouts/${workoutId}/exercises`,
      )
      return result ?? []
    },
  })

  useEffect(() => {
    if (isWorkoutExercisesError && workoutExercisesError)
      toast.error(workoutExercisesError.message)
  }, [isWorkoutExercisesError, workoutExercisesError])

  // ========== FILTER STATE (FOR EXERCISE LIBRARY) ==========
  const [muscleGroup, setMuscleGroup] = useState<string>('all')
  const [equipment, setEquipment] = useState<string>('all')
  const [difficulty, setDifficulty] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesMuscle =
        muscleGroup === 'all' || ex.muscleGroup === muscleGroup
      const matchesEquip = equipment === 'all' || ex.equipment === equipment
      const matchesDiff = difficulty === 'all' || ex.difficulty === difficulty
      const matchesSearch =
        !search ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.description?.toLowerCase().includes(search.toLowerCase())

      return matchesMuscle && matchesEquip && matchesDiff && matchesSearch
    })
  }, [exercises, muscleGroup, equipment, difficulty, search])

  // ========== ADD EXERCISE MODAL ==========
  const [isAddOpen, setIsAddOpen] = useState(false)

  // CREATE workout exercise mutation
  const createWorkoutExerciseMutation = useMutation<
    WorkoutExercise,
    Error,
    CreateWorkoutExerciseInput
  >({
    mutationFn: async (input) => {
      const requestPromise = api<WorkoutExercise>(
        `workouts/${workoutId}/exercises`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      )

      const result = await toast.promise(requestPromise, {
        pending: 'Adding exercise...',
        success: 'Exercise added to workout',
        error: {
          render({ data }) {
            const e = data as Error | undefined
            return e?.message ?? 'Failed to add exercise'
          },
        },
      })

      if (!result) throw new Error('Failed to add exercise')
      return result
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workoutExercisesKeys.list(workoutId),
      })

      setIsAddOpen(false)
    },
  })

  const openAddModal = () => {
    setIsAddOpen(true)
  }

  // ========== EDIT/DELETE WORKOUT ==========
  const [isEditWorkoutOpen, setIsEditWorkoutOpen] = useState(false)

  // UPDATE workout mutation
  const updateWorkoutMutation = useMutation<void, Error, UpdateWorkoutInput>({
    mutationFn: async (input) => {
      const requestPromise = api(
        `trainingprograms/${programId}/workouts/${workoutId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      )

      await toast.promise(requestPromise, {
        pending: 'Saving workout...',
        success: 'Workout updated',
        error: {
          render({ data }) {
            return (data as Error)?.message ?? 'Update failed'
          },
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workoutsKeys.list(programId),
      })
      setIsEditWorkoutOpen(false)
    },
  })

  // DELETE workout mutation
  const deleteWorkoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      const requestPromise = api(
        `trainingprograms/${programId}/workouts/${workoutId}`,
        { method: 'DELETE' },
      )

      await toast.promise(requestPromise, {
        pending: 'Deleting workout...',
        success: 'Workout deleted',
        error: {
          render({ data }) {
            return (data as Error)?.message ?? 'Delete failed'
          },
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workoutsKeys.list(programId),
      })
      queryClient.removeQueries({
        queryKey: workoutExercisesKeys.list(workoutId),
      })
      navigate({ to: '/programs/$programId', params: { programId } })
    },
  })

  // DELETE workout with optimistic undo - hook called at top level
  const executeDeleteWorkout = useUndoableDelete<Workout[], Workout>({
    queryKey: workoutsKeys.list(programId),
    deleteFn: () => deleteWorkoutMutation.mutateAsync(),
    optimisticUpdate: (old) => old?.filter((w) => w.id !== workoutId) ?? [],
    getItemLabel: () => workout?.name || 'workout',
  })

  const handleDeleteWorkout = () => {
    executeDeleteWorkout(workout!)
  }

  // ========== EDIT/DELETE WORKOUT EXERCISE ==========
  const [isEditWEOpen, setIsEditWEOpen] = useState(false)
  const [editingWE, setEditingWE] = useState<WorkoutExercise | null>(null)

  const openEditWEModal = (we: WorkoutExercise) => {
    setEditingWE(we)
    setIsEditWEOpen(true)
  }

  // UPDATE workout exercise mutation
  const updateWorkoutExerciseMutation = useMutation<
    void,
    Error,
    { id: string; input: UpdateWorkoutExerciseInput }
  >({
    mutationFn: async ({ id, input }) => {
      const requestPromise = api(`workouts/${workoutId}/exercises/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      await toast.promise(requestPromise, {
        pending: 'Saving exercise...',
        success: 'Exercise updated',
        error: {
          render({ data }) {
            return (data as Error)?.message ?? 'Update failed'
          },
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workoutExercisesKeys.list(workoutId),
      })
      setIsEditWEOpen(false)
      setEditingWE(null)
    },
  })

  // DELETE workout exercise mutation
  const deleteWorkoutExerciseMutation = useMutation<void, Error, string>({
    mutationFn: async (workoutExerciseId) => {
      await api(`workouts/${workoutId}/exercises/${workoutExerciseId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workoutExercisesKeys.list(workoutId),
      })
    },
  })

  // DELETE workout exercise with optimistic undo - hook called at top level
  const executeDeleteWorkoutExercise = useUndoableDelete<
    WorkoutExercise[],
    WorkoutExercise
  >({
    queryKey: workoutExercisesKeys.list(workoutId),
    deleteFn: (we) => deleteWorkoutExerciseMutation.mutateAsync(we.id),
    optimisticUpdate: (old, we) => old?.filter((ex) => ex.id !== we.id) ?? [],
    getItemLabel: (we) => we.exerciseName,
  })

  // Handler that calls the delete function returned by hook
  const handleDeleteWE = (we: WorkoutExercise) => {
    executeDeleteWorkoutExercise(we)
  }

  // ========== RENDER HELPERS ==========
  const ExerciseLibrarySection = () => (
    <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">
          Exercise Library
        </h2>
        <p className="text-sm text-gray-600">
          Filter and search exercises to add to this workout.
        </p>
      </div>

      <ExerciseFilters
        muscleGroup={muscleGroup}
        setMuscleGroup={setMuscleGroup}
        equipment={equipment}
        setEquipment={setEquipment}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        search={search}
        setSearch={setSearch}
      />

      {isExercisesLoading ? (
        <p className="text-sm text-gray-600">Loading exercises...</p>
      ) : filteredExercises.length === 0 ? (
        <p className="text-sm text-gray-600">No exercises match the filters.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {filteredExercises.map((ex) => (
            <li
              key={ex.id}
              className="p-3 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{ex.name}</p>
                <p className="text-xs text-gray-600">
                  {humanizeEnum(ex.muscleGroup)} • {humanizeEnum(ex.equipment)}{' '}
                  • {humanizeEnum(ex.difficulty)}
                </p>
                {ex.description && (
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                    {ex.description}
                  </p>
                )}
              </div>

              <button
                className="shrink-0 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                onClick={openAddModal}
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900 truncate">
              {workout?.name ?? (isWorkoutLoading ? 'Loading...' : 'Unknown')}
            </h1>
            {workout?.dayOfWeek && (
              <p className="text-sm text-gray-600">{workout.dayOfWeek}</p>
            )}
            {workout?.notes && (
              <p className="text-sm text-gray-700">{workout.notes}</p>
            )}
            <BackLink
              to="/programs/$programId"
              params={{ programId }}
              label="Back to Program"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditWorkoutOpen(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={() => setIsDeleteWorkoutDialogOpen(true)}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Mobile: Toggle Exercise Library */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowExerciseLibrary(!showExerciseLibrary)}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {showExerciseLibrary ? 'Hide' : 'Show'} Exercise Library
          </button>
        </div>

        {/* Mobile: Conditional Render */}
        <div className="lg:hidden space-y-6">
          {showExerciseLibrary ? (
            <ExerciseLibrarySection />
          ) : (
            <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Exercises in this Workout
                </h2>
                <button
                  onClick={openAddModal}
                  className="shrink-0 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>

              {isWorkoutExercisesLoading ? (
                <p className="text-sm text-gray-600">Loading exercises...</p>
              ) : workoutExercises.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No exercises in this workout yet. Add some from the library!
                </p>
              ) : (
                <ul className="space-y-3">
                  {workoutExercises.map((we) => (
                    <li key={we.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900">
                            {we.exerciseName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {we.sets} sets × {we.reps} reps
                            {we.weight != null && ` @ ${we.weight} kg`}
                          </p>
                          {we.notes && (
                            <p className="text-sm text-gray-700 mt-1">
                              {we.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => openEditWEModal(we)}
                            className="text-xs rounded-md bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteWE(we)}
                            className="text-xs rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        {/* Desktop: Side-by-Side */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Left: Exercises in Workout */}
          <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Exercises in this Workout
              </h2>
              <button
                onClick={openAddModal}
                className="shrink-0 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Add
              </button>
            </div>

            {isWorkoutExercisesLoading ? (
              <p className="text-sm text-gray-600">Loading exercises...</p>
            ) : workoutExercises.length === 0 ? (
              <p className="text-sm text-gray-600">
                No exercises in this workout yet. Add some from the library!
              </p>
            ) : (
              <ul className="space-y-3">
                {workoutExercises.map((we) => (
                  <li key={we.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">
                          {we.exerciseName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {we.sets} sets × {we.reps} reps
                          {we.weight != null && ` @ ${we.weight} kg`}
                        </p>
                        {we.notes && (
                          <p className="text-sm text-gray-700 mt-1">
                            {we.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => openEditWEModal(we)}
                          className="text-xs rounded-md bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteWE(we)}
                          className="text-xs rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Right: Exercise Library */}
          <ExerciseLibrarySection />
        </div>
      </div>

      {/* Modal for adding exercise */}
      {isAddOpen && (
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          title="Add Exercise to Workout"
        >
          <WorkoutExerciseForm
            exercises={exercises}
            submitLabel="Add Exercise"
            isSubmitting={createWorkoutExerciseMutation.isPending}
            onSubmit={(values) => {
              const input: CreateWorkoutExerciseInput = {
                exerciseId: values.exerciseId,
                sets: values.sets,
                reps: values.reps,
                weight: values.weight ? Number(values.weight) : undefined,
                notes: values.notes,
              }
              createWorkoutExerciseMutation.mutate(input)
            }}
            onCancel={() => setIsAddOpen(false)}
          />
        </Modal>
      )}

      {/* Modal for editing workout */}
      {isEditWorkoutOpen && (
        <Modal
          isOpen={isEditWorkoutOpen}
          onClose={() => setIsEditWorkoutOpen(false)}
          title="Edit Workout"
        >
          <WorkoutForm
            defaultValues={
              workout
                ? {
                    name: workout.name,
                    dayOfWeek: workout.dayOfWeek ?? undefined,
                    notes: workout.notes ?? undefined,
                  }
                : undefined
            }
            submitLabel="Update Workout"
            isSubmitting={updateWorkoutMutation.isPending}
            onSubmit={(values) => {
              updateWorkoutMutation.mutate(values)
            }}
            onCancel={() => setIsEditWorkoutOpen(false)}
          />
        </Modal>
      )}

      {/* Modal for editing workout exercise */}
      {isEditWEOpen && editingWE && (
        <Modal
          isOpen={isEditWEOpen}
          onClose={() => setIsEditWEOpen(false)}
          title="Edit Exercise"
        >
          <WorkoutExerciseForm
            defaultValues={
              editingWE
                ? {
                    exerciseId: editingWE.exerciseId,
                    sets: editingWE.sets,
                    reps: editingWE.reps,
                    weight:
                      editingWE.weight != null
                        ? String(editingWE.weight)
                        : undefined,
                    notes: editingWE.notes ?? undefined,
                  }
                : undefined
            }
            submitLabel="Update Exercise"
            isSubmitting={updateWorkoutExerciseMutation.isPending}
            showExerciseSelector={false}
            onSubmit={(values) => {
              if (editingWE) {
                const input: UpdateWorkoutExerciseInput = {
                  sets: values.sets,
                  reps: values.reps,
                  weight: values.weight ? Number(values.weight) : undefined,
                  notes: values.notes,
                }
                updateWorkoutExerciseMutation.mutate({
                  id: editingWE.id,
                  input,
                })
              }
            }}
            onCancel={() => setIsEditWEOpen(false)}
          />
        </Modal>
      )}

      {/* Confirm Delete Workout Dialog */}
      <ConfirmDialog
        isOpen={isDeleteWorkoutDialogOpen}
        onClose={() => setIsDeleteWorkoutDialogOpen(false)}
        onConfirm={handleDeleteWorkout}
        title="Delete Workout"
        description={`Are you sure you want to delete "${workout?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />

      {/* Confirm Delete Workout Exercise Dialog */}
      <ConfirmDialog
        isOpen={!!workoutExerciseToDelete}
        onClose={() => setWorkoutExerciseToDelete(null)}
        onConfirm={() =>
          workoutExerciseToDelete && handleDeleteWE(workoutExerciseToDelete)
        }
        title="Remove Exercise"
        description={`Are you sure you want to remove "${workoutExerciseToDelete?.exerciseName}" from this workout? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  )
}
