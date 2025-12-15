import { type FormEvent, useState, useEffect } from 'react'
import type { Exercise } from '@/types/Exercise'

interface WorkoutExerciseFormValues {
  exerciseId: string
  sets: number
  reps: number
  weight?: string
  notes?: string
}

interface WorkoutExerciseFormProps {
  /**
   * Initial values for the form (used in edit mode)
   */
  defaultValues?: Partial<WorkoutExerciseFormValues>
  /**
   * Label for the submit button
   */
  submitLabel?: string
  /**
   * Whether the form is currently submitting
   */
  isSubmitting?: boolean
  /**
   * Available exercises to choose from (for create mode)
   */
  exercises?: Exercise[]
  /**
   * Whether to show the exercise selector (hidden in edit mode)
   */
  showExerciseSelector?: boolean
  /**
   * Callback when form is submitted with valid data
   */
  onSubmit: (values: WorkoutExerciseFormValues) => void
  /**
   * Callback when form is cancelled
   */
  onCancel?: () => void
}

/**
 * Reusable form for creating or editing workout exercises.
 * Supports both create and edit modes via props.
 */
export function WorkoutExerciseForm({
  defaultValues,
  submitLabel = 'Submit',
  isSubmitting = false,
  exercises = [],
  showExerciseSelector = true,
  onSubmit,
  onCancel,
}: WorkoutExerciseFormProps) {
  const [exerciseId, setExerciseId] = useState(defaultValues?.exerciseId ?? '')
  const [sets, setSets] = useState(defaultValues?.sets ?? 3)
  const [reps, setReps] = useState(defaultValues?.reps ?? 10)
  const [weight, setWeight] = useState(defaultValues?.weight ?? '')
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')

  // Sync form with defaultValues when they change (for edit mode)
  useEffect(() => {
    if (defaultValues) {
      setExerciseId(defaultValues.exerciseId ?? '')
      setSets(defaultValues.sets ?? 3)
      setReps(defaultValues.reps ?? 10)
      setWeight(defaultValues.weight ?? '')
      setNotes(defaultValues.notes ?? '')
    }
  }, [defaultValues])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (showExerciseSelector && !exerciseId) {
      return
    }

    if (sets < 1 || reps < 1) {
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

  const selectedExercise = exercises.find((ex) => ex.id === exerciseId)

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {showExerciseSelector && (
        <div className="space-y-1">
          <label
            htmlFor="exercise-select"
            className="text-sm font-medium text-gray-700"
          >
            Exercise *
          </label>
          <select
            id="exercise-select"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            required
            disabled={isSubmitting}
          >
            <option value="">Select an exercise...</option>
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
          {selectedExercise && (
            <p className="text-xs text-gray-500 mt-1">
              {selectedExercise.description}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor="exercise-sets"
            className="text-sm font-medium text-gray-700"
          >
            Sets *
          </label>
          <input
            id="exercise-sets"
            type="number"
            min="1"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={sets}
            onChange={(e) => setSets(Number(e.target.value))}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="exercise-reps"
            className="text-sm font-medium text-gray-700"
          >
            Reps *
          </label>
          <input
            id="exercise-reps"
            type="number"
            min="1"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="exercise-weight"
          className="text-sm font-medium text-gray-700"
        >
          Weight
        </label>
        <input
          id="exercise-weight"
          type="text"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g., 50kg or 100lbs"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="exercise-notes"
          className="text-sm font-medium text-gray-700"
        >
          Notes
        </label>
        <textarea
          id="exercise-notes"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={
            isSubmitting ||
            (showExerciseSelector && !exerciseId) ||
            sets < 1 ||
            reps < 1
          }
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
