import { type FormEvent, useState, useEffect } from 'react'

interface WorkoutFormValues {
  name: string
  dayOfWeek?: string
  notes?: string
}

interface WorkoutFormProps {
  /**
   * Initial values for the form (used in edit mode)
   */
  defaultValues?: Partial<WorkoutFormValues>
  /**
   * Label for the submit button
   */
  submitLabel?: string
  /**
   * Whether the form is currently submitting
   */
  isSubmitting?: boolean
  /**
   * Callback when form is submitted with valid data
   */
  onSubmit: (values: WorkoutFormValues) => void
  /**
   * Callback when form is cancelled
   */
  onCancel?: () => void
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

/**
 * Reusable form for creating or editing workouts.
 * Supports both create and edit modes via props.
 */
export function WorkoutForm({
  defaultValues,
  submitLabel = 'Submit',
  isSubmitting = false,
  onSubmit,
  onCancel,
}: WorkoutFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [dayOfWeek, setDayOfWeek] = useState(defaultValues?.dayOfWeek ?? '')
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')

  // Sync form with defaultValues when they change (for edit mode)
  useEffect(() => {
    if (defaultValues !== undefined) {
      setName(defaultValues.name ?? '')
      setDayOfWeek(defaultValues.dayOfWeek ?? '')
      setNotes(defaultValues.notes ?? '')
    }
  }, [defaultValues])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }

    onSubmit({
      name: trimmedName,
      dayOfWeek: dayOfWeek.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label
          htmlFor="workout-name"
          className="text-sm font-medium text-gray-700"
        >
          Name *
        </label>
        <input
          id="workout-name"
          type="text"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Upper Body Day"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="workout-day"
          className="text-sm font-medium text-gray-700"
        >
          Day of Week
        </label>
        <select
          id="workout-day"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
          disabled={isSubmitting}
        >
          <option value="">Select a day...</option>
          {DAYS_OF_WEEK.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="workout-notes"
          className="text-sm font-medium text-gray-700"
        >
          Notes
        </label>
        <textarea
          id="workout-notes"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
          rows={3}
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
          disabled={isSubmitting || !name.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
