import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import type { Exercise } from '@/types/Exercise'
import { ExerciseFilters } from '@/components/ExerciseFilters'
import { humanizeEnum } from '@/lib/humanizeEnum'

export function ExerciseLibraryPage() {
  const { getToken } = useAuth()

  const [category, setCategory] = useState('all')
  const [muscleGroup, setMuscleGroup] = useState('all')
  const [equipment, setEquipment] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  )

  const exerciseQueryKey = useMemo(
    () =>
      ['exercises', { category, muscleGroup, equipment, difficulty }] as const,
    [category, muscleGroup, equipment, difficulty],
  )

  const { data: exercises = [], isLoading } = useQuery<Exercise[], Error>({
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exercise Library</h1>
          <p className="text-gray-600 mt-2">
            Browse and explore exercises for your training programs
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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
        </div>

        {/* Exercise List */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Exercises ({exercises.length})
          </h2>

          {isLoading ? (
            <p className="text-sm text-gray-600">Loading exercises...</p>
          ) : exercises.length === 0 ? (
            <p className="text-sm text-gray-600">
              No exercises match the current filters.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
              {exercises.map((exercise) => (
                <li
                  key={exercise.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer focus-within:bg-gray-50"
                  onClick={() => setSelectedExercise(exercise)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedExercise(exercise)
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {exercise.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {humanizeEnum(exercise.muscleGroup)} •{' '}
                        {humanizeEnum(exercise.equipment)} •{' '}
                        {humanizeEnum(exercise.difficulty)}
                      </p>
                      {exercise.category && (
                        <p className="text-xs text-gray-500 mt-1">
                          Category: {humanizeEnum(exercise.category)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedExercise(exercise)
                      }}
                      className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      View Details
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Exercise Detail Modal */}
        {selectedExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedExercise.name}
                </h3>
                <button
                  className="shrink-0 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setSelectedExercise(null)}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    Muscle Group
                  </p>
                  <p className="text-base text-gray-900">
                    {humanizeEnum(selectedExercise.muscleGroup)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Equipment</p>
                  <p className="text-base text-gray-900">
                    {humanizeEnum(selectedExercise.equipment)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    Difficulty
                  </p>
                  <p className="text-base text-gray-900">
                    {humanizeEnum(selectedExercise.difficulty)}
                  </p>
                </div>

                {selectedExercise.category && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">
                      Category
                    </p>
                    <p className="text-base text-gray-900">
                      {humanizeEnum(selectedExercise.category)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
