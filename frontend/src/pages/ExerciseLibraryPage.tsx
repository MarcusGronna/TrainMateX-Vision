import { useMemo, useState } from 'react'
import { ExerciseFilters } from '@/components/ExerciseFilters'
import type { Exercise } from '@/types/Exercise'
import { humanizeEnum } from '@/lib/humanizeEnum'
import { useApi } from '@/lib/api/useApi'
import { useQuery } from '@tanstack/react-query'

export function ExerciseLibraryPage() {
  const { api } = useApi()

  // Filters
  const [muscleGroup, setMuscleGroup] = useState('all')
  const [equipment, setEquipment] = useState('all')
  const [difficulty, setDifficulty] = useState('all')

  // Fetch exercises with filters
  const exerciseQueryKey = useMemo(
    () => ['exercises', { muscleGroup, equipment, difficulty }] as const,
    [muscleGroup, equipment, difficulty],
  )

  const {
    data: exercises = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: exerciseQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (muscleGroup && muscleGroup !== 'all')
        params.set('MuscleGroup', muscleGroup)
      if (equipment && equipment !== 'all') params.set('Equipment', equipment)
      if (difficulty && difficulty !== 'all')
        params.set('Difficulty', difficulty)

      const qs = params.toString()
      const url = `/exercises${qs ? `?${qs}` : ''}`

      return api<Exercise[]>(url)
    },
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading exercises...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading exercises: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Exercise Library
      </h1>

      <div className="mb-6">
        <ExerciseFilters
          category="all"
          muscleGroup={muscleGroup}
          equipment={equipment}
          difficulty={difficulty}
          onCategoryChange={() => {}}
          onMuscleGroupChange={setMuscleGroup}
          onEquipmentChange={setEquipment}
          onDifficultyChange={setDifficulty}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.map((exercise: Exercise) => (
          <div
            key={exercise.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {exercise.name}
            </h3>
            <p className="text-gray-600 text-sm mb-4">{exercise.description}</p>
            <div className="flex flex-wrap gap-2">
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
          </div>
        ))}
      </div>

      {exercises.length === 0 && (
        <div className="text-center text-gray-600 py-12">
          No exercises found matching your filters.
        </div>
      )}
    </div>
  )
}
