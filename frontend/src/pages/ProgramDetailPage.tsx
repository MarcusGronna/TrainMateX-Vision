import type { TrainingProgram } from '@/types/TrainingProgram'
import type { Workout } from '@/types/Workout'
import { humanizeEnum } from '@/lib/humanizeEnum'
import { BackLink } from '@/components/BackLink'
import { useApi } from '@/lib/api/useApi'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useMemo, type FormEvent } from 'react'
import { toast } from 'react-toastify'

const TRAINING_PROGRAMS_QUERY_KEY = ['trainingPrograms'] as const
const WORKOUTS_QUERY_KEY = (programId: string) =>
  ['workouts', programId] as const

export function ProgramDetailPage() {
  const { programId } = useParams({ from: '/programs/$programId' })
  const { api } = useApi()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [isCreateWorkoutOpen, setIsCreateWorkoutOpen] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('')
  const [notes, setNotes] = useState('')

  // Fetch training programs
  const {
    data: programs = [],
    isPending: isProgramsLoading,
    isError: isProgramsError,
    error: programsError,
  } = useQuery<TrainingProgram[], Error>({
    queryKey: TRAINING_PROGRAMS_QUERY_KEY,
    queryFn: async () => {
      const result = await api<TrainingProgram[]>('trainingprograms')
      return result ?? []
    },
  })

  useEffect(() => {
    if (isProgramsError && programsError) toast.error(programsError.message)
  }, [isProgramsError, programsError])

  const program = useMemo(
    () => programs.find((p) => p.id === programId),
    [programs, programId],
  )

  // Fetch workouts for this program
  const {
    data: workouts = [],
    isPending: isWorkoutsLoading,
    isError: isWorkoutsError,
    error: workoutsError,
  } = useQuery<Workout[], Error>({
    queryKey: WORKOUTS_QUERY_KEY(programId),
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

  // Create workout mutation
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

      if (!result) {
        throw new Error('Failed to create workout - no response')
      }

      return result
    },
    onSuccess: async (newWorkout) => {
      await queryClient.invalidateQueries({
        queryKey: WORKOUTS_QUERY_KEY(programId),
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

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            {program?.name ?? (isProgramsLoading ? 'Loading...' : 'Unknown')}
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

        <button
          onClick={() => setIsCreateWorkoutOpen(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add Workout
        </button>
      </div>

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
                <button
                  onClick={() =>
                    navigate({
                      to: '/programs/$programId/workouts/$workoutId',
                      params: { programId, workoutId: workout.id },
                    })
                  }
                  className="w-full text-left hover:bg-gray-50 transition-colors rounded-md p-2 -m-2"
                >
                  <p className="font-semibold text-gray-900">{workout.name}</p>
                  {workout.dayOfWeek && (
                    <p className="text-sm text-gray-600">{workout.dayOfWeek}</p>
                  )}
                  {workout.notes && (
                    <p className="text-sm text-gray-700 mt-1">
                      {workout.notes}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Created: {new Date(workout.createdAt).toLocaleDateString()}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Create Workout Modal */}
      {isCreateWorkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Workout
              </h3>
              <button
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => setIsCreateWorkoutOpen(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateWorkout} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Name *
                </label>
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
                <label className="text-sm font-medium text-gray-700">
                  Notes
                </label>
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
                {createWorkoutMutation.isPending
                  ? 'Creating...'
                  : 'Create Workout'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
