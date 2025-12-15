import type { Exercise } from '@/types/Exercise'
import { humanizeEnum } from '@/lib/humanizeEnum'
import { ExerciseFilters } from '@/components/ExerciseFilters'
import { BackLink } from '@/components/BackLink'
import { useApi } from '@/lib/api/useApi'
import { exercisesKeys } from '@/features/exercises/keys'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

export function ExerciseLibraryPage() {
  const { api } = useApi()

  const [muscleGroup, setMuscleGroup] = useState('')
  const [equipment, setEquipment] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [search, setSearch] = useState('')

  const queryKey = useMemo(
    () => exercisesKeys.list({ muscleGroup, equipment, difficulty }),
    [muscleGroup, equipment, difficulty],
  )

  const {
    data: exercises = [],
    isPending,
    isError,
    error,
  } = useQuery<Exercise[], Error>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (muscleGroup) params.set('MuscleGroup', muscleGroup)
      if (equipment) params.set('Equipment', equipment)
      if (difficulty) params.set('Difficulty', difficulty)

      const qs = params.toString()
      const result = await api<Exercise[]>(`exercises${qs ? `?${qs}` : ''}`)
      return result ?? []
    },
  })

  useEffect(() => {
    if (isError && error) toast.error(error.message)
  }, [isError, error])

  const filteredExercises = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return exercises
    return exercises.filter((e) => e.name.toLowerCase().includes(term))
  }, [exercises, search])

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            Exercise Library
          </h1>
          <p className="text-sm text-gray-600">
            Browse and filter exercises by muscle group, equipment, and
            difficulty
          </p>
          <BackLink to="/programs" />
        </div>
      </div>

      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
        <ExerciseFilters
          muscleGroup={muscleGroup}
          setMuscleGroup={setMuscleGroup}
          equipment={equipment}
          setEquipment={setEquipment}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          search={search}
          setSearch={setSearch}
        />

        {isPending ? (
          <p className="text-sm text-gray-600">Loading exercises...</p>
        ) : filteredExercises.length === 0 ? (
          <p className="text-sm text-gray-600">
            No exercises match the filters.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {filteredExercises.map((exercise) => (
              <li key={exercise.id} className="p-3">
                <p className="font-medium text-gray-900">{exercise.name}</p>
                <p className="text-xs text-gray-600">
                  {humanizeEnum(exercise.muscleGroup)} •{' '}
                  {humanizeEnum(exercise.equipment)} •{' '}
                  {humanizeEnum(exercise.difficulty)}
                </p>
                {exercise.description && (
                  <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                    {exercise.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
