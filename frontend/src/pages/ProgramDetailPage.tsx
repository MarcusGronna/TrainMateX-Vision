import type { TrainingProgram } from '@/types/TrainingProgram'
import { useAuth } from '@clerk/clerk-react'
import { useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export function ProgramDetailPage() {
  const { programId } = useParams({ from: '/programs/$programId' })
  const { getToken } = useAuth()

  const [program, setProgram] = useState<TrainingProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = await getToken()
        if (!token) {
          setError('No auth token available')
          setLoading(false)
          return
        }

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}trainingprograms/${programId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`)
        }

        const data: TrainingProgram = await res.json()
        setProgram(data)
      } catch (err: any) {
        setError(err?.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    void fetchProgram()
  }, [getToken, programId])

  if (loading)
    return <p className="mt-10 text-center text-gray-600">Loading program...</p>
  if (error)
    return <p className="mt-10 text-center text-red-600">Error: {error}</p>
  if (!program)
    return <p className="mt-10 text-center text-gray-600">Program not found.</p>

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
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

      {/* Här kommer slice 3 senare: lista/create Workouts för detta program */}
    </div>
  )
}
