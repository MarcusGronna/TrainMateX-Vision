import { useState } from 'react'
import type { Exercise } from '@/types/Exercise'
import { humanizeEnum } from '@/lib/humanizeEnum'

interface WorkoutExerciseFormProps {
  exercises?: Exercise[]
  preselectedExercise?: Exercise
  defaultValues?: {
    exerciseId: string
    sets: number
    reps: number
    weight?: string
    notes?: string
  }
  onSubmit: (values: {
    exerciseId: string
    sets: number
    reps: number
    weight?: string
    notes?: string
  }) => void
  onCancel: () => void
  isSubmitting?: boolean
  submitLabel?: string
  showExerciseSelector?: boolean
}

export function WorkoutExerciseForm({
  exercises = [],
  preselectedExercise,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Add Exercise',
  showExerciseSelector = true,
}: WorkoutExerciseFormProps) {
  // Use preselectedExercise.id first, then defaultValues, then empty string
  const [exerciseId, setExerciseId] = useState(
    preselectedExercise?.id ?? defaultValues?.exerciseId ?? '',
  )
  const [sets, setSets] = useState(defaultValues?.sets ?? 3)
  const [reps, setReps] = useState(defaultValues?.reps ?? 10)
  const [weight, setWeight] = useState(defaultValues?.weight ?? '')
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!exerciseId) {
      return
    }

    onSubmit({
      exerciseId,
      sets,
      reps,
      weight: weight.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Exercise Selection - Only show if showExerciseSelector is true AND no preselectedExercise */}
      {showExerciseSelector && !preselectedExercise && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exercise <span className="text-red-500">*</span>
          </label>
          <select
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          >
            <option value="">Select an exercise...</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({humanizeEnum(ex.muscleGroup)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Show preselected exercise as a nice info card */}
      {preselectedExercise && (
        <div className="rounded-lg border-2 border-indigo-100 bg-indigo-50 p-4">
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">
            Selected Exercise
          </p>
          <p className="font-semibold text-gray-900 text-lg">
            {preselectedExercise.name}
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 border border-gray-200">
              {humanizeEnum(preselectedExercise.muscleGroup)}
            </span>
            <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 border border-gray-200">
              {humanizeEnum(preselectedExercise.equipment)}
            </span>
            <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 border border-gray-200">
              {humanizeEnum(preselectedExercise.difficulty)}
            </span>
          </div>
          {preselectedExercise.description && (
            <p className="text-sm text-gray-600 mt-2">
              {preselectedExercise.description}
            </p>
          )}
        </div>
      )}

      {/* Sets and Reps */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sets <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={sets}
            onChange={(e) => setSets(Number(e.target.value))}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reps <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      {/* Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Weight
        </label>
        <input
          type="text"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g., 50kg or 100lbs"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
          rows={3}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !exerciseId}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Adding...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
