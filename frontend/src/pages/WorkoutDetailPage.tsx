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

import { useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import type { Id } from 'react-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const WORKOUTS_QUERY_KEY = (programId: string) =>
  ['workouts', programId] as const
const WORKOUT_EXERCISES_QUERY_KEY = (workoutId: string) =>
  ['workoutExercises', workoutId] as const

export function WorkoutDetailPage() {
  const { programId, workoutId } = useParams({
    from: '/programs/$programId/workouts/$workoutId',
  })

  const { api } = useApi()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Toggle exercise library visibility (desktop only)
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false)

  // Listen for mobile menu event
  useEffect(() => {
    const handleOpenLibrary = () => {
      setShowExerciseLibrary(true)
    }
    window.addEventListener('openExerciseLibrary', handleOpenLibrary)
    return () =>
      window.removeEventListener('openExerciseLibrary', handleOpenLibrary)
  }, [])

  // Fetch workouts for the program
  const {
    data: workouts = [],
    isPending: isWorkoutsLoading,
    isError: isWorkoutsError,
    error: workoutsError,
  } = useQuery<Workout[], Error>({
    queryKey: WORKOUTS_QUERY_KEY(programId),
    queryFn: () => api<Workout[]>(`trainingprograms/${programId}/workouts`),
  })

  useEffect(() => {
    if (isWorkoutsError && workoutsError) toast.error(workoutsError.message)
  }, [isWorkoutsError, workoutsError])

  const workout = useMemo(
    () => workouts.find((w) => w.id === workoutId),
    [workouts, workoutId],
  )

  // Fetch workout exercises
  const {
    data: workoutExercises = [],
    isPending: isWorkoutExercisesLoading,
    isError: isWorkoutExercisesError,
    error: workoutExercisesError,
  } = useQuery<WorkoutExercise[], Error>({
    queryKey: WORKOUT_EXERCISES_QUERY_KEY(workoutId),
    queryFn: () => api<WorkoutExercise[]>(`workouts/${workoutId}/exercises`),
  })

  useEffect(() => {
    if (isWorkoutExercisesError && workoutExercisesError) {
      toast.error(workoutExercisesError.message)
    }
  }, [isWorkoutExercisesError, workoutExercisesError])

  // Exercise library filters
  const [muscleGroup, setMuscleGroup] = useState('')
  const [equipment, setEquipment] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [search, setSearch] = useState('')

  const exerciseQueryKey = useMemo(
    () => ['exercises', { muscleGroup, equipment, difficulty }] as const,
    [muscleGroup, equipment, difficulty],
  )

  // Fetch exercises for library
  const {
    data: exercises = [],
    isPending: isExercisesLoading,
    isError: isExercisesError,
    error: exercisesError,
  } = useQuery<Exercise[], Error>({
    queryKey: exerciseQueryKey,
    queryFn: () => {
      const params = new URLSearchParams()
      if (muscleGroup) params.set('MuscleGroup', muscleGroup)
      if (equipment) params.set('Equipment', equipment)
      if (difficulty) params.set('Difficulty', difficulty)

      const qs = params.toString()
      return api<Exercise[]>(`exercises${qs ? `?${qs}` : ''}`)
    },
  })

  useEffect(() => {
    if (isExercisesError && exercisesError) toast.error(exercisesError.message)
  }, [isExercisesError, exercisesError])

  const filteredExercises = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return exercises
    return exercises.filter((e) => e.name.toLowerCase().includes(term))
  }, [exercises, search])

  // ========== ADD EXERCISE MODAL ==========
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  )

  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [weight, setWeight] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

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

      return await toast.promise(requestPromise, {
        pending: 'Adding exercise...',
        success: 'Exercise added to workout',
        error: {
          render({ data }) {
            const e = data as Error | undefined
            return e?.message ?? 'Failed to add exercise'
          },
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: WORKOUT_EXERCISES_QUERY_KEY(workoutId),
      })

      setIsAddOpen(false)
      setSelectedExercise(null)
      setSets(3)
      setReps(10)
      setWeight('')
      setNotes('')
    },
  })

  const openAddModal = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setIsAddOpen(true)
  }

  const handleCreateWorkoutExercise = (e: FormEvent) => {
    e.preventDefault()

    if (!selectedExercise) {
      toast.warn('Select an exercise first')
      return
    }

    if (sets <= 0 || reps <= 0) {
      toast.warn('Sets and reps must be positive')
      return
    }

    const weightValue = weight === '' ? undefined : weight
    if (weightValue !== undefined && weightValue < 0) {
      toast.warn('Weight cannot be negative')
      return
    }

    createWorkoutExerciseMutation.mutate({
      exerciseId: selectedExercise.id,
      sets,
      reps,
      weight: weightValue,
      notes: notes.trim() || undefined,
    })
  }

  // ========== EDIT/DELETE WORKOUT ==========
  const [isEditWorkoutOpen, setIsEditWorkoutOpen] = useState(false)
  const [editWorkoutName, setEditWorkoutName] = useState('')
  const [editWorkoutDayOfWeek, setEditWorkoutDayOfWeek] = useState('')
  const [editWorkoutNotes, setEditWorkoutNotes] = useState('')

  // Sync modal fields when workout loads
  useEffect(() => {
    if (!workout) return
    setEditWorkoutName(workout.name ?? '')
    setEditWorkoutDayOfWeek(workout.dayOfWeek ?? '')
    setEditWorkoutNotes(workout.notes ?? '')
  }, [workout])

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
        queryKey: WORKOUTS_QUERY_KEY(programId),
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
        queryKey: WORKOUTS_QUERY_KEY(programId),
      })
      queryClient.removeQueries({
        queryKey: WORKOUT_EXERCISES_QUERY_KEY(workoutId),
      })
      navigate({ to: '/programs/$programId', params: { programId } })
    },
  })

  const submitEditWorkout = (e: FormEvent) => {
    e.preventDefault()

    const name = editWorkoutName.trim()
    if (!name) {
      toast.warn('Workout name is required')
      return
    }

    updateWorkoutMutation.mutate({
      name,
      dayOfWeek: editWorkoutDayOfWeek.trim() || undefined,
      notes: editWorkoutNotes.trim() || undefined,
    })
  }

  const handleDeleteWorkout = () => {
    // Store previous data for rollback
    const previousWorkouts = queryClient.getQueryData<Workout[]>(
      WORKOUTS_QUERY_KEY(programId),
    )

    // Optimistically remove from cache
    queryClient.setQueryData<Workout[]>(
      WORKOUTS_QUERY_KEY(programId),
      (old) => old?.filter((w) => w.id !== workoutId) ?? [],
    )

    let timeoutId: NodeJS.Timeout | null = null
    let toastId: Id | null = null
    let isUndone = false

    // Show undo toast
    toastId = toast.info(
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-gray-700">
          Deleted <strong>{workout?.name || 'workout'}</strong>
        </span>
        <button
          onClick={() => {
            isUndone = true
            if (timeoutId) clearTimeout(timeoutId)
            if (toastId) toast.dismiss(toastId)

            // Rollback optimistic update
            queryClient.setQueryData(
              WORKOUTS_QUERY_KEY(programId),
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
        deleteWorkoutMutation.mutate(undefined, {
          onError: (error) => {
            // Rollback on error
            queryClient.setQueryData(
              WORKOUTS_QUERY_KEY(programId),
              previousWorkouts,
            )
            toast.error(error.message || 'Failed to delete workout')
          },
        })
      }
    }, 5000)
  }

  // ========== EDIT/DELETE WORKOUT EXERCISE ==========
  const [isEditWEOpen, setIsEditWEOpen] = useState(false)
  const [editingWE, setEditingWE] = useState<WorkoutExercise | null>(null)
  const [weSets, setWeSets] = useState(3)
  const [weReps, setWeReps] = useState(10)
  const [weWeight, setWeWeight] = useState<number | ''>('')
  const [weNotes, setWeNotes] = useState('')

  const openEditWEModal = (we: WorkoutExercise) => {
    setEditingWE(we)
    setWeSets(we.sets)
    setWeReps(we.reps)
    setWeWeight(we.weight ?? '')
    setWeNotes(we.notes ?? '')
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
        queryKey: WORKOUT_EXERCISES_QUERY_KEY(workoutId),
      })
      setIsEditWEOpen(false)
      setEditingWE(null)
    },
  })

  // DELETE workout exercise mutation
  const deleteWorkoutExerciseMutation = useMutation<void, Error, string>({
    mutationFn: async (workoutExerciseId) => {
      const requestPromise = api(
        `workouts/${workoutId}/exercises/${workoutExerciseId}`,
        { method: 'DELETE' },
      )

      await toast.promise(requestPromise, {
        pending: 'Removing exercise...',
        success: 'Exercise removed',
        error: {
          render({ data }) {
            return (data as Error)?.message ?? 'Remove failed'
          },
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: WORKOUT_EXERCISES_QUERY_KEY(workoutId),
      })
    },
  })

  const submitEditWorkoutExercise = (e: FormEvent) => {
    e.preventDefault()

    if (!editingWE) return

    if (weSets <= 0 || weReps <= 0) {
      toast.warn('Sets and reps must be positive')
      return
    }

    const weightValue = weWeight === '' ? null : weWeight
    if (weightValue !== null && weightValue < 0) {
      toast.warn('Weight cannot be negative')
      return
    }

    updateWorkoutExerciseMutation.mutate({
      id: editingWE.id,
      input: {
        sets: weSets,
        reps: weReps,
        weight: weightValue,
        notes: weNotes.trim() || null,
      },
    })
  }

  const handleDeleteWE = (we: WorkoutExercise) => {
    // Store previous data for rollback
    const previousExercises = queryClient.getQueryData<WorkoutExercise[]>(
      WORKOUT_EXERCISES_QUERY_KEY(workoutId),
    )

    // Optimistically remove from cache
    queryClient.setQueryData<WorkoutExercise[]>(
      WORKOUT_EXERCISES_QUERY_KEY(workoutId),
      (old) => old?.filter((ex) => ex.id !== we.id) ?? [],
    )

    let timeoutId: NodeJS.Timeout | null = null
    let toastId: Id | null = null
    let isUndone = false

    // Show undo toast
    toastId = toast.info(
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-gray-700">
          Removed <strong>{we.exerciseName}</strong>
        </span>
        <button
          onClick={() => {
            isUndone = true
            if (timeoutId) clearTimeout(timeoutId)
            if (toastId) toast.dismiss(toastId)

            // Rollback optimistic update
            queryClient.setQueryData(
              WORKOUT_EXERCISES_QUERY_KEY(workoutId),
              previousExercises,
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
        deleteWorkoutExerciseMutation.mutate(we.id, {
          onError: (error) => {
            // Rollback on error
            queryClient.setQueryData(
              WORKOUT_EXERCISES_QUERY_KEY(workoutId),
              previousExercises,
            )
            toast.error(error.message || 'Failed to remove exercise')
          },
        })
      }
    }, 5000)
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
                onClick={() => openAddModal(ex)}
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
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      {/* Header with Edit/Delete Workout buttons */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            Workout:{' '}
            {workout?.name ?? (isWorkoutsLoading ? 'Loading...' : 'Unknown')}
          </h1>
          <BackLink to="/programs/$programId" label="Back to Workouts" />
        </div>

        {workout && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditWorkoutOpen(true)}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteWorkout}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Desktop layout: 2-column grid */}
      <div className="hidden lg:grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExerciseLibrarySection />

        {/* Current Exercises with Edit/Delete buttons */}
        <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Exercises in {workout?.name || 'Workout'}
          </h2>

          {isWorkoutExercisesLoading ? (
            <p className="text-sm text-gray-600">
              Loading workout exercises...
            </p>
          ) : workoutExercises.length === 0 ? (
            <p className="text-sm text-gray-600">
              No exercises yet. Add one from the library.
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
                      <p className="text-sm text-gray-700">
                        {we.sets} x {we.reps}
                        {we.weight != null ? ` @ ${we.weight} kg` : ''}
                      </p>
                      {we.notes && (
                        <p className="text-sm text-gray-700 mt-1">{we.notes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Added: {new Date(we.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
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
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden space-y-6">
        <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Exercises in {workout?.name || 'Workout'}
          </h2>

          <button
            onClick={() => setShowExerciseLibrary(!showExerciseLibrary)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            {showExerciseLibrary ? '✕ Hide Library' : '+ Add Exercise'}
          </button>

          {isWorkoutExercisesLoading ? (
            <p className="text-sm text-gray-600">
              Loading workout exercises...
            </p>
          ) : workoutExercises.length === 0 ? (
            <p className="text-sm text-gray-600">
              No exercises yet. Add one from the library.
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
                      <p className="text-sm text-gray-700">
                        {we.sets} x {we.reps}
                        {we.weight != null ? ` @ ${we.weight} kg` : ''}
                      </p>
                      {we.notes && (
                        <p className="text-sm text-gray-700 mt-1">{we.notes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Added: {new Date(we.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
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

        {showExerciseLibrary && <ExerciseLibrarySection />}
      </div>

      {/* Modal for adding exercise */}
      {isAddOpen && selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  Add: {selectedExercise.name}
                </h3>
                <p className="text-xs text-gray-600">
                  {humanizeEnum(selectedExercise.muscleGroup)} •{' '}
                  {humanizeEnum(selectedExercise.equipment)} •{' '}
                  {humanizeEnum(selectedExercise.difficulty)}
                </p>
              </div>
              <button
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => setIsAddOpen(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateWorkoutExercise} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Sets
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={sets}
                    onChange={(e) => setSets(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Reps
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={reps}
                    onChange={(e) => setReps(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Weight (kg, optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={weight}
                    onChange={(e) => {
                      const v = e.target.value
                      setWeight(v === '' ? '' : Number(v))
                    }}
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Notes (optional)
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700"
                disabled={createWorkoutExerciseMutation.isPending}
              >
                {createWorkoutExerciseMutation.isPending
                  ? 'Adding...'
                  : 'Add to workout'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for editing workout */}
      {isEditWorkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Workout
              </h3>
              <button
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => setIsEditWorkoutOpen(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={submitEditWorkout} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={editWorkoutName}
                  onChange={(e) => setEditWorkoutName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Day of Week (optional)
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={editWorkoutDayOfWeek}
                  onChange={(e) => setEditWorkoutDayOfWeek(e.target.value)}
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
                <label className="text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={editWorkoutNotes}
                  onChange={(e) => setEditWorkoutNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
                disabled={updateWorkoutMutation.isPending}
              >
                {updateWorkoutMutation.isPending
                  ? 'Updating...'
                  : 'Update Workout'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for editing workout exercise */}
      {isEditWEOpen && editingWE && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit: {editingWE.exerciseName}
              </h3>
              <button
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => setIsEditWEOpen(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={submitEditWorkoutExercise} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Sets
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={weSets}
                    onChange={(e) => setWeSets(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Reps
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={weReps}
                    onChange={(e) => setWeReps(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Weight (kg, optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={weWeight}
                    onChange={(e) => {
                      const v = e.target.value
                      setWeWeight(v === '' ? '' : Number(v))
                    }}
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Notes (optional)
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={weNotes}
                    onChange={(e) => setWeNotes(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
                disabled={updateWorkoutExerciseMutation.isPending}
              >
                {updateWorkoutExerciseMutation.isPending
                  ? 'Updating...'
                  : 'Update Exercise'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
