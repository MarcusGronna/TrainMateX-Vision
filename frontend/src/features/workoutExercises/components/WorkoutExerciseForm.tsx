import { useState } from 'react'
import type { Exercise } from '@/types/Exercise'

export interface WorkoutExerciseFormValues {
  exerciseId: string
  sets: number
  reps: number
  weight?: string
  notes?: string
}

interface WorkoutExerciseFormProps {
  exercises?: Exercise[]
  defaultValues?: Partial<WorkoutExerciseFormValues>
  showExerciseSelector?: boolean
  submitLabel: string
  isSubmitting: boolean
  onSubmit: (values: WorkoutExerciseFormValues) => void
  onCancel: () => void
}

export function WorkoutExerciseForm({
  exercises = [],
  defaultValues,
  showExerciseSelector = true,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: WorkoutExerciseFormProps) {
  const [formValues, setFormValues] = useState<WorkoutExerciseFormValues>({
    exerciseId: defaultValues?.exerciseId ?? '',
    sets: defaultValues?.sets ?? 3,
    reps: defaultValues?.reps ?? 10,
    weight: defaultValues?.weight ?? '',
    notes: defaultValues?.notes ?? '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValues.exerciseId.trim()) {
      alert('Please select an exercise')
      return
    }
    onSubmit(formValues)
  }

  const selectedExercise = exercises.find(
    (ex) => ex.id === formValues.exerciseId,
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showExerciseSelector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exercise
          </label>
          <select
            value={formValues.exerciseId}
            onChange={(e) =>
              setFormValues({ ...formValues, exerciseId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isSubmitting}
          >
            <option value="">Select an exercise</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedExercise && !showExerciseSelector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exercise
          </label>
          <p className="text-gray-900">{selectedExercise.name}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sets
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={formValues.sets}
            onChange={(e) =>
              setFormValues({
                ...formValues,
                sets: parseInt(e.target.value) || 1,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reps
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={formValues.reps}
            onChange={(e) =>
              setFormValues({
                ...formValues,
                reps: parseInt(e.target.value) || 1,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Weight (optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 50 lbs, 25 kg"
          value={formValues.weight || ''}
          onChange={(e) =>
            setFormValues({ ...formValues, weight: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          rows={3}
          placeholder="Add any notes about the exercise..."
          value={formValues.notes || ''}
          onChange={(e) =>
            setFormValues({ ...formValues, notes: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md font-medium transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
