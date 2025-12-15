import type { MuscleGroup, Equipment, Difficulty } from '@/types/Exercise'
import { humanizeEnum } from '@/lib/humanizeEnum'

interface ExerciseFiltersProps {
  muscleGroup: string
  equipment: string
  difficulty: string
  onMuscleGroupChange: (value: string) => void
  onEquipmentChange: (value: string) => void
  onDifficultyChange: (value: string) => void
  muscleGroups?: MuscleGroup[]
  equipmentOptions?: Equipment[]
  difficulties?: Difficulty[]
}

export function ExerciseFilters({
  muscleGroup,
  equipment,
  difficulty,
  onMuscleGroupChange,
  onEquipmentChange,
  onDifficultyChange,
  muscleGroups = [],
  equipmentOptions = [],
  difficulties = [],
}: ExerciseFiltersProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Muscle Group Filter */}
      <div>
        <label
          htmlFor="muscle-group"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Muscle Group
        </label>
        <select
          id="muscle-group"
          value={muscleGroup}
          onChange={(e) => onMuscleGroupChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Muscle Groups</option>
          {muscleGroups.map((mg) => (
            <option key={mg} value={mg}>
              {humanizeEnum(mg)}
            </option>
          ))}
        </select>
      </div>

      {/* Equipment Filter */}
      <div>
        <label
          htmlFor="equipment"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Equipment
        </label>
        <select
          id="equipment"
          value={equipment}
          onChange={(e) => onEquipmentChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Equipment</option>
          {equipmentOptions.map((eq) => (
            <option key={eq} value={eq}>
              {humanizeEnum(eq)}
            </option>
          ))}
        </select>
      </div>

      {/* Difficulty Filter */}
      <div>
        <label
          htmlFor="difficulty"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Difficulty
        </label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => onDifficultyChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
