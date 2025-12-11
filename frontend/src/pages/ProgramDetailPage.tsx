import type { TrainingProgram } from '@/types/TrainingProgram'
import type { CreateWorkoutInput, Workout } from '@/types/Workout'
import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'

const WORKOUT_QUERY_KEY = (programId: string) =>
  ['workouts', programId] as const

export function ProgramDetailPage() {
  const { programId } = useParams({ from: '/programs/$programId' })
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  const {
    data: program,
    isPending: isProgramLoading,
    isError: isProgramError,
    error: programError,
  } = useQuery<TrainingProgram, Error>({
    queryKey: ['trainingprogram', programId],
    queryFn: async () => {
      const token = await getToken()
      if (!token) {
        throw new Error('Missing auth token')
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}trainingprograms/${programId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `Failed to load program (status ${res.status})`)
      }

      return (await res.json()) as TrainingProgram
    },
  })

  useEffect(() => {
    if (isProgramError && programError) {
      const message = programError.message ?? 'Failed to load program'
      toast.error(message)
    }
  }, [isProgramError, programError])

  const {
    data: workouts = [],
    isPending: isWorkoutsLoading,
    isError: isWorkoutsError,
    error: workoutsError,
  } = useQuery<Workout[], Error>({
    queryKey: WORKOUT_QUERY_KEY(programId),
    queryFn: async () => {
      const token = await getToken()
      if (!token) {
        throw new Error('Missing auth token')
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}trainingprograms/${programId}/workouts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `Failed to load workouts (status ${res.status})`)
      }

      return (await res.json()) as Workout[]
    },
  })

  useEffect(() => {
    if (isWorkoutsError && workoutsError) {
      const message = workoutsError.message ?? 'Failed to load workouts'
      toast.error(message)
    }
  }, [isWorkoutsError, workoutsError])

  const [name, setName] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('')
  const [notes, setNotes] = useState('')

  const createWorkoutMutation = useMutation<Workout, Error, CreateWorkoutInput>(
    {
      mutationFn: async (input: CreateWorkoutInput) => {
        const token = await getToken()
        if (!token) {
          throw new Error('Missing auth token')
        }

        const requestPromise = (async () => {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}trainingprograms/${programId}/workouts`,
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

          return (await res.json()) as Workout
        })()

        return await toast.promise(requestPromise, {
          pending: 'Creating workout...',
          success: 'Workout created',
          error: {
            render({ data }) {
              const e = data as Error | undefined
              return e?.message ?? 'Failed to create workout'
            },
          },
        })
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: WORKOUT_QUERY_KEY(programId),
        })

        setName('')
        setDayOfWeek('')
        setNotes('')
      },
    },
  )

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.warn('Name is required')
      return
    }

    createWorkoutMutation.mutate({
      name: name.trim(),
      dayOfWeek: dayOfWeek.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  if (isProgramLoading && !program) {
    return <p className="mt-10 text-center text-gray-600">Loading program...</p>
  }

  if (isProgramError || !program) {
    const message = programError?.message ?? 'Program not found.'
    return <p className="mt-10 text-center text-red-600">Error: {message}</p>
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">{program.name}</h1>
        {program.level && (
          <p className="text-sm text-gray-500">Level: {program.level}</p>
        )}
        {program.description && (
          <p className="text-sm text-gray-700">{program.description}</p>
        )}
        <p className="text-xs text-gray-400">
          Created: {new Date(program.createdAt).toLocaleDateString()}
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-xl border bg-white p-4 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-gray-900">Create workout</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Leg Day, Push, Pull..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Day of week (optional)
          </label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
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
            Notes (optional)
          </label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Short notes about the workout..."
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white transition hover:bg-indigo-700"
        >
          {createWorkoutMutation.isPending ? 'Creating...' : 'Create Workout'}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Workouts in this program
        </h2>

        {isWorkoutsLoading ? (
          <p className="text-center text-gray-600">Loading workouts...</p>
        ) : workouts.length === 0 ? (
          <p className="text-center text-gray-600">
            No workouts yet. Create your first one above.
          </p>
        ) : (
          <ul className="space-y-3">
            {workouts.map((w) => (
              <li
                key={w.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{w.name}</h3>
                  {w.dayOfWeek && (
                    <span className="text-xs uppercase text-gray-500">
                      {w.dayOfWeek}
                    </span>
                  )}
                </div>
                {w.notes && (
                  <p className="mt-1 text-sm text-gray-700">{w.notes}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  Created: {new Date(w.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
