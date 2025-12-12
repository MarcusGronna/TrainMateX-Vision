import type { Exercise } from '@/types/Exercise'
import { humanizeEnum } from '@/lib/humanizeEnum'
import { ExerciseFilters } from '@/components/ExerciseFilters'

import { useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

export function ExerciseLibraryPage() {
  const { getToken } = useAuth()

  const [muscleGroup, setMuscleGroup] = useState('')
  const [equipment, setEquipment] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [search, setSearch] = useState('')

  const queryKey = useMemo(
    () => ['exercises', { muscleGroup, equipment, difficulty }] as const,
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
      const token = await getToken()
      if (!token) throw new Error('Missing auth token')

      const params = new URLSearchParams()
      if (muscleGroup) params.set('MuscleGroup', muscleGroup)
      if (equipment) params.set('Equipment', equipment)
      if (difficulty) params.set('Difficulty', difficulty)

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

  useEffect(() => {
    if (isError && error) toast.error(error.message)
  }, [isError, error])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return exercises
    return exercises.filter((e) => e.name.toLowerCase().includes(term))
  }, [exercises, search])

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Exercise library</h1>

      <div className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
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
      </div>

      {isPending ? (
        <p className="text-gray-600">Loading exercises...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600">No exercises found.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((ex) => (
            <li
              key={ex.id}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{ex.name}</p>
                  <p className="text-xs text-gray-600">
                    {humanizeEnum(ex.muscleGroup)} •{' '}
                    {humanizeEnum(ex.equipment)} • {humanizeEnum(ex.difficulty)}
                  </p>
                  {ex.description && (
                    <p className="text-sm text-gray-700 mt-2">
                      {ex.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
