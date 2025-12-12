import type { Exercise } from '@/types/Exercise'
import type {
  CreateWorkoutExerciseInput,
  WorkoutExercise,
} from '@/types/WorkoutExercise'
import type { Workout } from '@/types/Workout'
import { humanizeEnum } from '@/lib/humanizeEnum'

import { useAuth } from '@clerk/clerk-react'
import { Link, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

  // 1) Hämta workouts för programmet (återanvänder befintlig endpoint).
  //    Vi använder detta för att kunna visa workoutets "Name" i headern.
  const {
    data: workouts = [],
    isPending: isWorkoutsLoading,
    isError: isWorkoutsError,
    error: workoutsError,
  } = useQuery<Workout[], Error>({
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

  useEffect(() => {
    if (isWorkoutsError && workoutsError) toast.error(workoutsError.message)
  }, [isWorkoutsError, workoutsError])

  const workout = useMemo(
    () => workouts.find((w) => w.id === workoutId),
    [workouts, workoutId],
  )

  // 2) Hämta workoutets övningar (WorkoutExercise)
  const {
    data: workoutExercises = [],
    isPending: isWorkoutExercisesLoading,
    isError: isWorkoutExercisesError,
    error: workoutExercisesError,
  } = useQuery<WorkoutExercise[], Error>({
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

  useEffect(() => {
    if (isWorkoutExercisesError && workoutExercisesError) {
      toast.error(workoutExercisesError.message)
    }
  }, [isWorkoutExercisesError, workoutExercisesError])

  // 3) Exercise library (server-side filter via query params)
  const [muscleGroup, setMuscleGroup] = useState('')
  const [equipment, setEquipment] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [search, setSearch] = useState('') // client-side textfilter (utan refetch per keypress)

  const exerciseQueryKey = useMemo(
    () => ['exercises', { muscleGroup, equipment, difficulty }] as const,
    [muscleGroup, equipment, difficulty],
  )

  const {
    data: exercises = [],
    isPending: isExercisesLoading,
    isError: isExercisesError,
    error: exercisesError,
  } = useQuery<Exercise[], Error>({
    queryKey: exerciseQueryKey,
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const params = new URLSearchParams()
      if (muscleGroup) params.set('MuscleGroup', muscleGroup)
      if (equipment) params.set('Equipment', equipment)
      if (difficulty) params.set('Difficulty', difficulty)

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

  useEffect(() => {
    if (isExercisesError && exercisesError) toast.error(exercisesError.message)
  }, [isExercisesError, exercisesError])

  const filteredExercises = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return exercises
    return exercises.filter((e) => e.name.toLowerCase().includes(term))
  }, [exercises, search])

  // 4) Modal state för att skapa WorkoutExercise
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  )

  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [weight, setWeight] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  const createWorkoutExerciseMutation = useMutation<
    WorkoutExercise,
    Error,
    CreateWorkoutExerciseInput
  >({
    mutationFn: async (input) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const requestPromise = (async () => {
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
      })()

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

      // Reset modal state
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

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            Workout:{' '}
            {workout?.name ?? (isWorkoutsLoading ? 'Loading...' : 'Unknown')}
          </h1>
          <p className="text-sm text-gray-600">
            <Link
              to="/programs/$programId"
              params={{ programId }}
              className="text-indigo-600 hover:underline"
            >
              Back to program
            </Link>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT: Exercise library */}
        <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Exercise library
            </h2>
            <p className="text-sm text-gray-600">
              Filter server-side via query params, and search client-side by
              name.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                MuscleGroup
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                placeholder="e.g. Chest"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Equipment
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="e.g. Barbell"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Difficulty
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                placeholder="e.g. Beginner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Search
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
              />
            </div>
          </div>

          {isExercisesLoading ? (
            <p className="text-sm text-gray-600">Loading exercises...</p>
          ) : filteredExercises.length === 0 ? (
            <p className="text-sm text-gray-600">
              No exercises match the filters.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {filteredExercises.map((ex) => (
                <li
                  key={ex.id}
                  className="p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {ex.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {humanizeEnum(ex.muscleGroup)} •{' '}
                      {humanizeEnum(ex.equipment)} •{' '}
                      {humanizeEnum(ex.difficulty)}
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

        {/* RIGHT: WorkoutExercises */}
        <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Exercises in workout
            </h2>
          </div>

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
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900">
                      {we.exerciseName}
                    </p>
                    <p className="text-sm text-gray-700">
                      {we.sets} x {we.reps}
                      {we.weight != null ? ` @ ${we.weight}` : ''}
                    </p>
                  </div>
                  {we.notes && (
                    <p className="text-sm text-gray-700 mt-1">{we.notes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Added: {new Date(we.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Modal */}
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
                    Weight (optional)
                  </label>
                  <input
                    type="number"
                    min={0}
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
              >
                {createWorkoutExerciseMutation.isPending
                  ? 'Adding...'
                  : 'Add to workout'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edge-case: om workoutId inte hittas i listan */}
      {!isWorkoutsLoading && workouts.length > 0 && !workout && (
        <p className="text-sm text-red-600">
          Workout not found in this program (or you do not have access).
        </p>
      )}
    </div>
  )
}
