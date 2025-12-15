import { humanizeEnum } from '@/lib/humanizeEnum'

// Update the interface to accept readonly string arrays:

interface ExerciseFiltersProps {
  muscleGroup: string
  equipment: string
  difficulty: string
  onMuscleGroupChange: (value: string) => void
  onEquipmentChange: (value: string) => void
  onDifficultyChange: (value: string) => void
  muscleGroups: readonly string[]
  equipmentOptions: readonly string[]
  difficulties: readonly string[]
}

export function ExerciseFilters({
  muscleGroup,
  equipment,
  difficulty,
  onMuscleGroupChange,
  onEquipmentChange,
  onDifficultyChange,
  muscleGroups,
  equipmentOptions,
  difficulties,
}: ExerciseFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Muscle Group
        </label>
        <select
          value={muscleGroup}
          onChange={(e) => onMuscleGroupChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Muscle Groups</option>
          {muscleGroups.map((mg) => (
            <option key={mg} value={mg}>
              {humanizeEnum(mg)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Equipment
        </label>
        <select
          value={equipment}
          onChange={(e) => onEquipmentChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Equipment</option>
          {equipmentOptions.map((eq) => (
            <option key={eq} value={eq}>
              {humanizeEnum(eq)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Difficulty
        </label>
        <select
          value={difficulty}
          onChange={(e) => onDifficultyChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Difficulties</option>
          {difficulties.map((diff) => (
            <option key={diff} value={diff}>
              {humanizeEnum(diff)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
