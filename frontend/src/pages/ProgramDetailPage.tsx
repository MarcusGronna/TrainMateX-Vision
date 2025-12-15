import type { TrainingProgram } from '@/types/TrainingProgram'
import type { Workout } from '@/types/Workout'
import type { UpdateTrainingProgramInput } from '@/types/CreateTrainingProgramInput'
import type { CreateWorkoutInput } from '@/types/Workout'
import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { BackLink } from '@/components/BackLink'

const WORKOUT_QUERY_KEY = (programId: string) =>
  ['workouts', programId] as const

export function ProgramDetailPage() {
  const { programId } = useParams({ from: '/programs/$programId/' })
  const { getToken } = useAuth()
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
  const [workoutName, setWorkoutName] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('')
  const [notes, setNotes] = useState('')

  // Edit workout modal state
  const [isEditWorkoutOpen, setIsEditWorkoutOpen] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [editWorkoutName, setEditWorkoutName] = useState('')
  const [editDayOfWeek, setEditDayOfWeek] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const {
    data: program,
    isPending: isProgramLoading,
    isError: isProgramError,
    error: programError,
  } = useQuery<TrainingProgram, Error>({
    queryKey: ['trainingprogram', programId],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

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
    if (isProgramError && programError) toast.error(programError.message)
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

  const createWorkoutMutation = useMutation<
    Workout,
    Error,
    { name: string; dayOfWeek?: string; notes?: string }
  >({
    mutationFn: async (input) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

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

      setWorkoutName('')
      setDayOfWeek('')
      setNotes('')
    },
  })

  const updateProgramMutation = useMutation<
    TrainingProgram,
    Error,
    UpdateTrainingProgramInput
  >({
    mutationFn: async (input) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const requestPromise = (async () => {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}trainingprograms/${programId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(input),
          },
        )

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || `Update failed with status ${res.status}`)
        }

        return (await res.json()) as TrainingProgram
      })()

      return await toast.promise(requestPromise, {
        pending: 'Updating program...',
        success: 'Program updated',
        error: {
          render({ data }) {
            const e = data as Error | undefined
            return e?.message ?? 'Failed to update program'
          },
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['trainingprograms'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['trainingprogram', programId],
      })

      setIsEditProgramOpen(false)
    },
  })

  const deleteProgramMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const requestPromise = (async () => {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}trainingprograms/${programId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || `Delete failed with status ${res.status}`)
        }
      })()

      return await toast.promise(requestPromise, {
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
        queryKey: ['trainingprograms'],
      })

      navigate({ to: '/' })
    },
  })

  const updateWorkoutMutation = useMutation<
    Workout,
    Error,
    { workoutId: string; input: CreateWorkoutInput }
  >({
    mutationFn: async ({ workoutId, input }) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const requestPromise = (async () => {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}trainingprograms/${programId}/workouts/${workoutId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(input),
          },
        )

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || `Update failed with status ${res.status}`)
        }

        return (await res.json()) as Workout
      })()

      return await toast.promise(requestPromise, {
        pending: 'Updating workout...',
        success: 'Workout updated',
        error: {
          render({ data }) {
            const e = data as Error | undefined
            return e?.message ?? 'Failed to update workout'
          },
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: WORKOUT_QUERY_KEY(programId),
      })

      setIsEditWorkoutOpen(false)
      setEditingWorkout(null)
    },
  })

  const deleteWorkoutMutation = useMutation<void, Error, string>({
    mutationFn: async (workoutId) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const requestPromise = (async () => {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}trainingprograms/${programId}/workouts/${workoutId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || `Delete failed with status ${res.status}`)
        }
      })()

      return await toast.promise(requestPromise, {
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
        queryKey: WORKOUT_QUERY_KEY(programId),
      })
    },
  })

  const handleCreateWorkout = (e: FormEvent) => {
    e.preventDefault()

    if (!workoutName.trim()) {
      toast.warn('Workout name is required')
      return
    }

    createWorkoutMutation.mutate({
      name: workoutName.trim(),
      dayOfWeek: dayOfWeek.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  const handleEditProgram = (e: FormEvent) => {
    e.preventDefault()

    if (!editProgramName.trim()) {
      toast.warn('Program name is required')
      return
    }

    updateProgramMutation.mutate({
      name: editProgramName.trim(),
      description: editProgramDescription.trim() || undefined,
      level: editProgramLevel,
    })
  }

  const handleDeleteProgram = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${program?.name}"? This will also delete all workouts.`,
      )
    ) {
      deleteProgramMutation.mutate()
    }
  }

  const openEditProgramModal = () => {
    if (!program) return
    setEditProgramName(program.name)
    setEditProgramDescription(program.description || '')
    setEditProgramLevel(
      (program.level || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
    )
    setIsEditProgramOpen(true)
  }

  const handleEditWorkout = (e: FormEvent) => {
    e.preventDefault()

    if (!editingWorkout) return

    if (!editWorkoutName.trim()) {
      toast.warn('Workout name is required')
      return
    }

    updateWorkoutMutation.mutate({
      workoutId: editingWorkout.id,
      input: {
        name: editWorkoutName.trim(),
        dayOfWeek: editDayOfWeek.trim() || undefined,
        notes: editNotes.trim() || undefined,
      },
    })
  }

  const handleDeleteWorkout = (workout: Workout) => {
    if (
      window.confirm(
        `Are you sure you want to delete workout "${workout.name}"?`,
      )
    ) {
      deleteWorkoutMutation.mutate(workout.id)
    }
  }

  const openEditWorkoutModal = (workout: Workout) => {
    setEditingWorkout(workout)
    setEditWorkoutName(workout.name)
    setEditDayOfWeek(workout.dayOfWeek || '')
    setEditNotes(workout.notes || '')
    setIsEditWorkoutOpen(true)
  }

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">
              {program?.name ?? (isProgramLoading ? 'Loading...' : 'Unknown')}
            </h1>
            {program?.description && (
              <p className="text-sm text-gray-700 mt-1">
                {program.description}
              </p>
            )}
            {program?.level && (
              <p className="text-sm text-gray-600 mt-1">
                Level: {program.level}
              </p>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={openEditProgramModal}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteProgram}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>

        <BackLink to="/" />
      </div>

      {/* Create Workout Form */}
      <form
        onSubmit={handleCreateWorkout}
        className="space-y-4 rounded-xl border bg-white p-4 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-gray-900">Create workout</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="Leg Day, Push, Pull..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Day of week (optional)
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
            Notes (optional)
          </label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Short notes about the workout..."
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

      {/* Workouts List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Workouts in this program
        </h2>

        {isWorkoutsLoading ? (
          <p className="text-gray-600">Loading workouts...</p>
        ) : isWorkoutsError ? (
          <p className="text-gray-600">Could not load workouts.</p>
        ) : workouts.length === 0 ? (
          <p className="text-gray-600">
            No workouts yet. Create one to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {workouts.map((w) => (
              <li
                key={w.id}
                className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to="/programs/$programId/workouts/$workoutId"
                    params={{ programId, workoutId: w.id }}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-semibold text-gray-900">{w.name}</p>
                    {w.dayOfWeek && (
                      <p className="text-sm text-gray-600 mt-1">
                        {w.dayOfWeek}
                      </p>
                    )}
                    {w.notes && (
                      <p className="text-sm text-gray-700 mt-1">{w.notes}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Created: {new Date(w.createdAt).toLocaleDateString()}
                    </p>
                  </Link>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditWorkoutModal(w)
                      }}
                      className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteWorkout(w)
                      }}
                      className="px-3 py-1 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit Program Modal */}
      {isEditProgramOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Program
              </h3>
              <button
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => setIsEditProgramOpen(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleEditProgram} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Name
                </label>
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
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Level
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={editProgramLevel}
                  onChange={(e) =>
                    setEditProgramLevel(
                      e.target.value as
                        | 'beginner'
                        | 'intermediate'
                        | 'advanced',
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
                {updateProgramMutation.isPending
                  ? 'Updating...'
                  : 'Update Program'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Workout Modal */}
      {isEditWorkoutOpen && editingWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4">
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

            <form onSubmit={handleEditWorkout} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Name
                </label>
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
                <label className="text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700"
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
    </div>
  )
}
