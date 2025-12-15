import { type FormEvent, useState, useEffect } from 'react'

interface ProgramFormValues {
  name: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced'
}

interface ProgramFormProps {
  /**
   * Initial values for the form (used in edit mode)
   */
  defaultValues?: Partial<ProgramFormValues>
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
  onSubmit: (values: ProgramFormValues) => void
  /**
   * Callback when form is cancelled
   */
  onCancel?: () => void
}

/**
 * Reusable form for creating or editing training programs.
 * Supports both create and edit modes via props.
 */
export function ProgramForm({
  defaultValues,
  submitLabel = 'Submit',
  isSubmitting = false,
  onSubmit,
  onCancel,
}: ProgramFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [description, setDescription] = useState(
    defaultValues?.description ?? '',
  )
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    defaultValues?.level ?? 'beginner',
  )

  // Sync form with defaultValues when they change (for edit mode)
  useEffect(() => {
    if (defaultValues) {
      setName(defaultValues.name ?? '')
      setDescription(defaultValues.description ?? '')
      setLevel(defaultValues.level ?? 'beginner')
    }
  }, [defaultValues])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      // Let parent handle validation error display
      return
    }

    onSubmit({
      name: trimmedName,
      description: description.trim(),
      level,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label
          htmlFor="program-name"
          className="text-sm font-medium text-gray-700"
        >
          Name *
        </label>
        <input
          id="program-name"
          type="text"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., 5x5 Strength Program"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="program-description"
          className="text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="program-description"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="program-level"
          className="text-sm font-medium text-gray-700"
        >
          Level
        </label>
        <select
          id="program-level"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={level}
          onChange={(e) =>
            setLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')
          }
          disabled={isSubmitting}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
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
