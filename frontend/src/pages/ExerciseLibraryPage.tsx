import type { Exercise } from '@/types/Exercise'
import { humanizeEnum } from '@/lib/humanizeEnum'
import { ExerciseFilters } from '@/components/ExerciseFilters'
import { useApi } from '@/lib/api/useApi'
import { exercisesKeys } from '@/features/exercises/keys'
import { Card, CardDescription, CardTitle } from '@/components/ui/Card'
import { SectionTitle } from '@/components/ui/SectionTitle'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

export function ExerciseLibraryPage() {
  const { api } = useApi()

  const [muscleGroup, setMuscleGroup] = useState<string>('all')
  const [equipment, setEquipment] = useState<string>('all')
  const [difficulty, setDifficulty] = useState<string>('all')
  const [search, setSearch] = useState('')

  // Fetch all exercises
  const {
    data: exercises = [],
    isPending,
    isError,
    error,
  } = useQuery<Exercise[], Error>({
    queryKey: exercisesKeys.list(),
    queryFn: async () => {
      const result = await api<Exercise[]>('exercises')
      return result ?? []
    },
  })

  useEffect(() => {
    if (isError && error) toast.error(error.message)
  }, [isError, error])

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesMuscle =
        muscleGroup === 'all' || ex.muscleGroup === muscleGroup
      const matchesEquip = equipment === 'all' || ex.equipment === equipment
      const matchesDiff = difficulty === 'all' || ex.difficulty === difficulty
      const matchesSearch =
        !search ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.description?.toLowerCase().includes(search.toLowerCase())

      return matchesMuscle && matchesEquip && matchesDiff && matchesSearch
    })
  }, [exercises, muscleGroup, equipment, difficulty, search])

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <SectionTitle description="Browse and filter exercises by muscle group, equipment, and difficulty">
        Exercise Library
      </SectionTitle>

      <Card>
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
      </Card>

      {isPending ? (
        <p className="text-sm text-gray-600">Loading exercises...</p>
      ) : filteredExercises.length === 0 ? (
        <Card>
          <p className="text-center text-gray-600">
            No exercises match the selected filters.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map((ex) => (
            <Card key={ex.id} hover>
              <CardTitle>{ex.name}</CardTitle>
              <p className="text-xs text-gray-600 mt-1">
                {humanizeEnum(ex.muscleGroup)} • {humanizeEnum(ex.equipment)} •{' '}
                {humanizeEnum(ex.difficulty)}
              </p>
              {ex.description && (
                <CardDescription className="mt-2 line-clamp-3">
                  {ex.description}
                </CardDescription>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
