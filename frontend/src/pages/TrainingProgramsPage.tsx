import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import type { TrainingProgram } from '@/types/TrainingProgram'
import type { CreateTrainingProgramInput } from '@/types/CreateTrainingProgramInput'
import { useUndoableDelete } from '@/hooks/useUndoableDelete'

const PROGRAMS_QUERY_KEY = ['trainingPrograms'] as const

export function TrainingProgramsPage() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(
    null,
  )
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: programs = [], isLoading } = useQuery<TrainingProgram[], Error>(
    {
      queryKey: PROGRAMS_QUERY_KEY,
      queryFn: async () => {
        const token = await getToken()
        if (!token) throw new Error('Missing auth token')

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}trainingprograms`,
          { headers: { Authorization: `Bearer ${token}` } },
        )

        if (!res.ok) {
          const msg = await res.text()
          throw new Error(
            msg || `Failed to load programs (status ${res.status})`,
          )
        }

        return (await res.json()) as TrainingProgram[]
      },
    },
  )

  const createMutation = useMutation<
    TrainingProgram,
    Error,
    CreateTrainingProgramInput
  >({
    mutationFn: async (input) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}trainingprograms`,
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

      return (await res.json()) as TrainingProgram
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY })
      setShowCreateModal(false)
      setName('')
      setDescription('')
    },
  })

  const updateMutation = useMutation<
    TrainingProgram,
    Error,
    { id: string } & CreateTrainingProgramInput
  >({
    mutationFn: async ({ id, ...input }) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}trainingprograms/${id}`,
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY })
      setShowEditModal(false)
      setEditingProgram(null)
      setName('')
      setDescription('')
    },
  })

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}trainingprograms/${id}`,
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
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY })
    },
  })

  const executeDelete = useUndoableDelete<TrainingProgram[], TrainingProgram>({
    queryKey: PROGRAMS_QUERY_KEY,
    deleteFn: (program) => deleteMutation.mutateAsync(program.id),
    optimisticUpdate: (old, program) =>
      old?.filter((p) => p.id !== program.id) ?? [],
    getItemLabel: (program) => program.name,
  })

  const openEditModal = (program: TrainingProgram) => {
    setEditingProgram(program)
    setName(program.name)
    setDescription(program.description ?? '')
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
    if (!editingProgram) return

    updateMutation.mutate({
      id: editingProgram.id,
      name,
      description: description.trim() || undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">Loading programs...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Training Programs
            </h1>
            <p className="text-gray-600 mt-2">
              Create and manage your workout programs
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Create Program
          </button>
        </div>

        {/* Programs List */}
        {programs.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">
              No programs yet. Create your first training program to get
              started.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {programs.map((program) => (
              <li key={program.id} className="relative group">
                <Link
                  to="/programs/$programId"
                  params={{ programId: program.id }}
                  className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-semibold text-indigo-600 group-hover:text-indigo-700">
                        {program.name}
                      </h3>
                      {program.description && (
                        <p className="text-gray-700 mt-2">
                          {program.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          openEditModal(program)
                        }}
                        className="relative z-10 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          executeDelete(program)
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

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Create Training Program
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
                    Program Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., 12-Week Strength Program"
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
                    placeholder="Brief description of the program..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Program'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit Training Program
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
                    Program Name
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
