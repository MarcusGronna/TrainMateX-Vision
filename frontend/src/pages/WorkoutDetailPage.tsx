import { useState, useMemo } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import type { Exercise } from '@/types/Exercise'
import type { Workout } from '@/types/Workout'
import type { WorkoutExercise } from '@/types/WorkoutExercise'
import { ExerciseFilters } from '@/components/ExerciseFilters'
import { humanizeEnum } from '@/lib/humanizeEnum'
import { BackLink } from '@/components/BackLink'
import { useUndoableDelete } from '@/hooks/useUndoableDelete'

const WORKOUTS_QUERY_KEY = (programId: string) =>
  ['workouts', programId] as const
const WORKOUT_EXERCISES_QUERY_KEY = (workoutId: string) =>
  ['workoutExercises', workoutId] as const

export function WorkoutDetailPage() {
  const { programId, workoutId } = useParams({
    from: '/programs/$programId/workouts/$workoutId',
  })

  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  // Filters
  const [category, setCategory] = useState('all')
  const [muscleGroup, setMuscleGroup] = useState('all')
  const [equipment, setEquipment] = useState('all')
  const [difficulty, setDifficulty] = useState('all')

  // Modal state
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false)
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  )
  const [editingWorkoutExercise, setEditingWorkoutExercise] =
    useState<WorkoutExercise | null>(null)
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [weight, setWeight] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  // Fetch workouts for the program
  const { data: workouts = [], isLoading: isWorkoutsLoading } = useQuery<
    Workout[],
    Error
  >({
    queryKey: WORKOUTS_QUERY_KEY(programId),
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}trainingprograms/${programId}/workouts`,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `Failed to load workouts (status ${res.status})`)
      }

      return (await res.json()) as Workout[]
    },
  })

  // Find the specific workout
  const workout = useMemo(
    () => workouts.find((w) => w.id === workoutId),
    [workouts, workoutId],
  )

  // Fetch workout exercises
  const { data: workoutExercises = [], isLoading: isWorkoutExercisesLoading } =
    useQuery<WorkoutExercise[], Error>({
      queryKey: WORKOUT_EXERCISES_QUERY_KEY(workoutId),
      queryFn: async () => {
        const token = await getToken()
        if (!token) throw new Error('Missing auth token')

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}workouts/${workoutId}/exercises`,
          { headers: { Authorization: `Bearer ${token}` } },
        )

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(
            msg || `Failed to load workout exercises (status ${res.status})`,
          )
        }

        return (await res.json()) as WorkoutExercise[]
      },
    })

  // Fetch all exercises
  const exerciseQueryKey = useMemo(
    () =>
      ['exercises', { category, muscleGroup, equipment, difficulty }] as const,
    [category, muscleGroup, equipment, difficulty],
  )

  const { data: exercises = [], isLoading: isExercisesLoading } = useQuery<
    Exercise[],
    Error
  >({
    queryKey: exerciseQueryKey,
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const params = new URLSearchParams()
      if (category && category !== 'all') params.set('Category', category)
      if (muscleGroup && muscleGroup !== 'all')
        params.set('MuscleGroup', muscleGroup)
      if (equipment && equipment !== 'all') params.set('Equipment', equipment)
      if (difficulty && difficulty !== 'all')
        params.set('Difficulty', difficulty)

      const qs = params.toString()
      const url = `${import.meta.env.VITE_API_BASE_URL}exercises${qs ? `?${qs}` : ''}`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(
          msg || `Failed to load exercises (status ${res.status})`,
        )
      }

      return (await res.json()) as Exercise[]
    },
  })

  // Add workout exercise mutation
  const addExerciseMutation = useMutation({
    mutationFn: async (input: {
      exerciseId: string
      sets: number
      reps: number
      weight?: number
      notes?: string
    }) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}workouts/${workoutId}/exercises`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(input),
        },
      )

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `Create failed with status ${res.status}`)
      }

      return (await res.json()) as WorkoutExercise
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: WORKOUT_EXERCISES_QUERY_KEY(workoutId),
      })
      setShowAddExerciseModal(false)
      setSelectedExercise(null)
      setSets(3)
      setReps(10)
      setWeight('')
      setNotes('')
    },
  })

  // Update workout exercise mutation
  const updateExerciseMutation = useMutation({
    mutationFn: async (input: {
      id: string
      sets: number
      reps: number
      weight?: number
      notes?: string
    }) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}workouts/${workoutId}/exercises/${input.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sets: input.sets,
            reps: input.reps,
            weight: input.weight,
            notes: input.notes,
          }),
        },
      )

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `Update failed with status ${res.status}`)
      }

      return (await res.json()) as WorkoutExercise
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: WORKOUT_EXERCISES_QUERY_KEY(workoutId),
      })
      setShowEditExerciseModal(false)
      setEditingWorkoutExercise(null)
      setSets(3)
      setReps(10)
      setWeight('')
      setNotes('')
    },
  })

  // Delete workout exercise mutation
  const deleteExerciseMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}workouts/${workoutId}/exercises/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `Delete failed with status ${res.status}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: WORKOUT_EXERCISES_QUERY_KEY(workoutId),
      })
    },
  })

  // DELETE workout exercise with optimistic undo
  const executeDeleteWorkoutExercise = useUndoableDelete<
    WorkoutExercise[],
    WorkoutExercise
  >({
    queryKey: WORKOUT_EXERCISES_QUERY_KEY(workoutId),
    deleteFn: (exercise) => deleteExerciseMutation.mutateAsync(exercise.id),
    optimisticUpdate: (old, exercise) =>
      old?.filter((we) => we.id !== exercise.id) ?? [],
    getItemLabel: (exercise) => exercise.exerciseName,
  })

  const openAddModal = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setShowAddExerciseModal(true)
  }

  const openEditModal = (workoutExercise: WorkoutExercise) => {
    setEditingWorkoutExercise(workoutExercise)
    setSets(workoutExercise.sets)
    setReps(workoutExercise.reps)
    setWeight(workoutExercise.weight ?? '')
    setNotes(workoutExercise.notes ?? '')
    setShowEditExerciseModal(true)
  }

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExercise) return

    addExerciseMutation.mutate({
      exerciseId: selectedExercise.id,
      sets,
      reps,
      weight: weight === '' ? undefined : weight,
      notes: notes.trim() || undefined,
    })
  }

  const handleUpdateExercise = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWorkoutExercise) return

    updateExerciseMutation.mutate({
      id: editingWorkoutExercise.id,
      sets,
      reps,
      weight: weight === '' ? undefined : weight,
      notes: notes.trim() || undefined,
    })
  }

  const handleRemoveExercise = (workoutExercise: WorkoutExercise) => {
    executeDeleteWorkoutExercise(workoutExercise)
  }

  if (isWorkoutsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">Loading workout...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Workout not found
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{workout.name}</h1>
            <BackLink
              to="/programs/$programId"
              params={{ programId }}
              label="Back to program"
            />
          </div>
        </div>

        {/* Current Exercises */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Exercises in Workout
          </h2>

          {isWorkoutExercisesLoading ? (
            <p className="text-sm text-gray-600">
              Loading workout exercises...
            </p>
          ) : workoutExercises.length === 0 ? (
            <p className="text-sm text-gray-600">
              No exercises yet. Add one from the library below.
            </p>
          ) : (
            <ul className="space-y-3">
              {workoutExercises.map((we) => (
                <li
                  key={we.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2"
                  onClick={() => openEditModal(we)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openEditModal(we)
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900">
                      {we.exerciseName}
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-700 font-medium">
                        {we.sets} sets × {we.reps} reps
                        {we.weight != null ? ` @ ${we.weight}kg` : ''}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveExercise(we)
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {we.notes && (
                    <p className="text-sm text-gray-600 mt-2">{we.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Exercise Library */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Exercise Library
            </h2>
            <p className="text-sm text-gray-600">
              Filter and browse exercises to add to your workout.
            </p>
          </div>

          <ExerciseFilters
            category={category}
            muscleGroup={muscleGroup}
            equipment={equipment}
            difficulty={difficulty}
            onCategoryChange={setCategory}
            onMuscleGroupChange={setMuscleGroup}
            onEquipmentChange={setEquipment}
            onDifficultyChange={setDifficulty}
          />

          {isExercisesLoading ? (
            <p className="text-sm text-gray-600">Loading exercises...</p>
          ) : exercises.length === 0 ? (
            <p className="text-sm text-gray-600">
              No exercises match the current filters.
            </p>
          ) : (
            <div className="relative">
              {exercises.length > 6 && (
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-10 rounded-t-lg" />
              )}
              <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                {exercises.map((ex) => (
                  <li
                    key={ex.id}
                    className="p-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {ex.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {humanizeEnum(ex.muscleGroup)} •{' '}
                        {humanizeEnum(ex.equipment)} •{' '}
                        {humanizeEnum(ex.difficulty)}
                      </p>
                    </div>
                    <button
                      className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => openAddModal(ex)}
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Add Exercise Modal */}
        {showAddExerciseModal && selectedExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 truncate">
                    Add Exercise
                  </h3>
                  <p className="text-base text-gray-900 mt-1 truncate">
                    {selectedExercise.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {humanizeEnum(selectedExercise.muscleGroup)} •{' '}
                    {humanizeEnum(selectedExercise.equipment)} •{' '}
                    {humanizeEnum(selectedExercise.difficulty)}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setShowAddExerciseModal(false)}
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleAddExercise} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Sets
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={sets}
                      onChange={(e) => setSets(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Reps
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={reps}
                      onChange={(e) => setReps(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Weight (kg){' '}
                      <span className="text-gray-500 font-normal">
                        optional
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={weight}
                      onChange={(e) =>
                        setWeight(
                          e.target.value === '' ? '' : Number(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Notes{' '}
                      <span className="text-gray-500 font-normal">
                        optional
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Focus on form, tempo notes..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={addExerciseMutation.isPending}
                  className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {addExerciseMutation.isPending
                    ? 'Adding...'
                    : 'Add to Workout'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Exercise Modal */}
        {showEditExerciseModal && editingWorkoutExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 truncate">
                    Edit Exercise
                  </h3>
                  <p className="text-base text-gray-900 mt-1 truncate">
                    {editingWorkoutExercise.exerciseName}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setShowEditExerciseModal(false)}
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleUpdateExercise} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Sets
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={sets}
                      onChange={(e) => setSets(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Reps
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={reps}
                      onChange={(e) => setReps(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Weight (kg){' '}
                      <span className="text-gray-500 font-normal">
                        optional
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={weight}
                      onChange={(e) =>
                        setWeight(
                          e.target.value === '' ? '' : Number(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Notes{' '}
                      <span className="text-gray-500 font-normal">
                        optional
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Focus on form, tempo notes..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updateExerciseMutation.isPending}
                  className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {updateExerciseMutation.isPending
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
