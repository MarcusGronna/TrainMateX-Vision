import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/lib/api/useApi'
import type { Exercise } from '@/types/Exercise'
import type { Workout } from '@/types/Workout'
import type { WorkoutExercise } from '@/types/WorkoutExercise'
import { ExerciseFilters } from '@/components/ExerciseFilters'
import {
  WorkoutExerciseForm,
  type WorkoutExerciseFormValues,
} from '@/features/workoutExercises/components/WorkoutExerciseForm'
import { MUSCLE_GROUPS, EQUIPMENT, DIFFICULTIES } from '@/lib/exerciseEnums'
import { humanizeEnum } from '@/lib/humanizeEnum'

export function WorkoutDetailPage() {
  const { workoutId } = useParams({
    from: '/programs/$programId/workouts/$workoutId',
  })
  const queryClient = useQueryClient()
  const { api } = useApi()

  // Filters
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>('all')
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')

  // Modal state
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(
    null,
  )

  // Fetch workout details
  const { data: workout, isLoading: isWorkoutLoading } = useQuery({
    queryKey: ['workoutDetails', workoutId],
    queryFn: () => api<Workout>(`/workouts/${workoutId}`),
  })

  // Fetch all exercises
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => api<Exercise[]>('/exercises'),
  })

  // Fetch workout exercises for this workout
  const { data: workoutExercises = [] } = useQuery({
    queryKey: ['workoutExercises', workoutId],
    queryFn: () => api<WorkoutExercise[]>(`/workouts/${workoutId}/exercises`),
  })

  // Add workout exercise mutation
  const addExerciseMutation = useMutation({
    mutationFn: (values: WorkoutExerciseFormValues) =>
      api<WorkoutExercise>(`/workouts/${workoutId}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workoutExercises', workoutId],
      })
      setShowAddExerciseModal(false)
    },
  })

  // Update workout exercise mutation
  const updateExerciseMutation = useMutation({
    mutationFn: (values: WorkoutExerciseFormValues) =>
      api<WorkoutExercise>(
        `/workouts/${workoutId}/exercises/${editingExerciseId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workoutExercises', workoutId],
      })
      setEditingExerciseId(null)
    },
  })

  // Delete workout exercise mutation
  const deleteExerciseMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/workouts/${workoutId}/exercises/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workoutExercises', workoutId],
      })
    },
  })

  const handleAddExercise = (values: WorkoutExerciseFormValues) => {
    addExerciseMutation.mutate(values)
  }

  const handleUpdateExercise = (values: WorkoutExerciseFormValues) => {
    updateExerciseMutation.mutate(values)
  }

  const handleDeleteExercise = (id: string) => {
    if (confirm('Are you sure you want to remove this exercise?')) {
      deleteExerciseMutation.mutate(id)
    }
  }

  const handleCancel = () => {
    setShowAddExerciseModal(false)
    setEditingExerciseId(null)
  }

  if (isWorkoutLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading workout...</div>
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Workout not found
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{workout.name}</h1>
        <p className="text-gray-600 mt-2">{workout.description}</p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Exercises</h2>
        <button
          onClick={() => setShowAddExerciseModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md font-medium transition-colors"
        >
          Add Exercise
        </button>
      </div>

      {showAddExerciseModal && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Add Exercise
          </h3>
          <WorkoutExerciseForm
            exercises={exercises}
            showExerciseSelector={true}
            submitLabel="Add Exercise"
            isSubmitting={addExerciseMutation.isPending}
            onSubmit={handleAddExercise}
            onCancel={handleCancel}
          />
        </div>
      )}

      {editingExerciseId && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Edit Exercise
          </h3>
          <WorkoutExerciseForm
            exercises={exercises}
            defaultValues={
              workoutExercises.find((we) => we.id === editingExerciseId)
                ? {
                    ...workoutExercises.find(
                      (we) => we.id === editingExerciseId,
                    ),
                    weight:
                      workoutExercises
                        .find((we) => we.id === editingExerciseId)
                        ?.weight?.toString() || undefined,
                    notes:
                      workoutExercises.find((we) => we.id === editingExerciseId)
                        ?.notes || undefined,
                  }
                : undefined
            }
            showExerciseSelector={false}
            submitLabel="Update Exercise"
            isSubmitting={updateExerciseMutation.isPending}
            onSubmit={handleUpdateExercise}
            onCancel={handleCancel}
          />
        </div>
      )}

      <div className="mb-6">
        <ExerciseFilters
          muscleGroup={muscleGroupFilter}
          equipment={equipmentFilter}
          difficulty={difficultyFilter}
          onMuscleGroupChange={setMuscleGroupFilter}
          onEquipmentChange={setEquipmentFilter}
          onDifficultyChange={setDifficultyFilter}
          muscleGroups={MUSCLE_GROUPS}
          equipmentOptions={EQUIPMENT}
          difficulties={DIFFICULTIES}
        />
      </div>

      {workoutExercises.length === 0 ? (
        <div className="text-center text-gray-600 py-12">
          No exercises added to this workout yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workoutExercises.map((we) => {
            const exercise = exercises.find((ex) => ex.id === we.exerciseId)
            return (
              <div
                key={we.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {exercise?.name || 'Unknown Exercise'}
                </h3>
                <div className="space-y-2 mb-4 text-sm text-gray-700">
                  <p>
                    <strong>Sets:</strong> {we.sets}
                  </p>
                  <p>
                    <strong>Reps:</strong> {we.reps}
                  </p>
                  {we.weight && (
                    <p>
                      <strong>Weight:</strong> {we.weight}
                    </p>
                  )}
                  {we.notes && (
                    <p>
                      <strong>Notes:</strong> {we.notes}
                    </p>
                  )}
                </div>
                {exercise && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                      {humanizeEnum(exercise.muscleGroup)}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {humanizeEnum(exercise.equipment)}
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                      {humanizeEnum(exercise.difficulty)}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingExerciseId(we.id)}
                    className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteExercise(we.id)}
                    className="flex-1 px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
