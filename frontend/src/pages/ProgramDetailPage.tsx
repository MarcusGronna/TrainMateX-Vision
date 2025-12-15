import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import type { TrainingProgram } from '@/types/TrainingProgram'
import type { Workout } from '@/types/Workout'
import { BackLink } from '@/components/BackLink'
import { useUndoableDelete } from '@/hooks/useUndoableDelete'

const PROGRAMS_QUERY_KEY = ['trainingPrograms'] as const
const WORKOUTS_QUERY_KEY = (programId: string) =>
  ['workouts', programId] as const

export function ProgramDetailPage() {
  const { programId } = useParams({ from: '/programs/$programId' })
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // Fetch program
  const { data: program, isLoading: isProgramLoading } = useQuery<
    TrainingProgram,
    Error
  >({
    queryKey: [...PROGRAMS_QUERY_KEY, programId],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}trainingprograms/${programId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `Failed to load program (status ${res.status})`)
      }

      return (await res.json()) as TrainingProgram
    },
  })

  // Fetch workouts
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

  const createMutation = useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUTS_QUERY_KEY(programId) })
      setShowCreateModal(false)
      setName('')
      setDescription('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (input: {
      id: string
      name: string
      description?: string
    }) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const { id, ...body } = input
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}workouts/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      )

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `Update failed with status ${res.status}`)
      }

      return (await res.json()) as Workout
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUTS_QUERY_KEY(programId) })
      setShowEditModal(false)
      setEditingWorkout(null)
      setName('')
      setDescription('')
    },
  })

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}workouts/${id}`,
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
      queryClient.invalidateQueries({ queryKey: WORKOUTS_QUERY_KEY(programId) })
    },
  })

  const executeDelete = useUndoableDelete<Workout[], Workout>({
    queryKey: WORKOUTS_QUERY_KEY(programId),
    deleteFn: (workout) => deleteMutation.mutateAsync(workout.id),
    optimisticUpdate: (old, workout) =>
      old?.filter((w) => w.id !== workout.id) ?? [],
    getItemLabel: (workout) => workout.name,
  })

  const openEditModal = (workout: Workout) => {
    setEditingWorkout(workout)
    setName(workout.name)
    setDescription(workout.description ?? '')
    setShowEditModal(true)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      name,
      description: description.trim() || undefined,
    })
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWorkout) return

    updateMutation.mutate({
      id: editingWorkout.id,
      name,
      description: description.trim() || undefined,
    })
  }

  if (isProgramLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">Loading program...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Program not found
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
            <h1 className="text-3xl font-bold text-gray-900">{program.name}</h1>
            {program.description && (
              <p className="text-gray-700">{program.description}</p>
            )}
            <BackLink to="/programs" label="Back to programs" />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Add Workout
          </button>
        </div>

        {/* Workouts List */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Workouts</h2>

          {isWorkoutsLoading ? (
            <p className="text-sm text-gray-600">Loading workouts...</p>
          ) : workouts.length === 0 ? (
            <p className="text-sm text-gray-600">
              No workouts yet. Add your first workout to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {workouts.map((workout) => (
                <li key={workout.id} className="relative group">
                  <Link
                    to="/programs/$programId/workouts/$workoutId"
                    params={{ programId, workoutId: workout.id }}
                    className="block rounded-lg border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-indigo-600 group-hover:text-indigo-700">
                          {workout.name}
                        </h3>
                        {workout.description && (
                          <p className="text-gray-700 mt-1">
                            {workout.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            openEditModal(workout)
                          }}
                          className="relative z-10 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            executeDelete(workout)
                          }}
                          className="relative z-10 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Add Workout
                </h3>
                <button
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setShowCreateModal(false)}
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Workout Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Upper Body Strength"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description{' '}
                    <span className="text-gray-500 font-normal">optional</span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the workout..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Workout'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingWorkout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit Workout
                </h3>
                <button
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setShowEditModal(false)}
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Workout Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description{' '}
                    <span className="text-gray-500 font-normal">optional</span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
