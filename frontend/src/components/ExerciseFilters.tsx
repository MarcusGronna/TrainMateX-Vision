import {
  Category,
  MuscleGroup,
  Equipment,
  Difficulty,
} from '@/lib/exerciseEnums'

interface ExerciseFiltersProps {
  category: string
  muscleGroup: string
  equipment: string
  difficulty: string
  onCategoryChange: (value: string) => void
  onMuscleGroupChange: (value: string) => void
  onEquipmentChange: (value: string) => void
  onDifficultyChange: (value: string) => void
}

export function ExerciseFilters({
  category,
  muscleGroup,
  equipment,
  difficulty,
  onCategoryChange,
  onMuscleGroupChange,
  onEquipmentChange,
  onDifficultyChange,
}: ExerciseFiltersProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="text-sm font-medium text-gray-700">Category</label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="all">All</option>
          {Object.values(Category).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">
          Muscle Group
        </label>
        <select
          value={muscleGroup}
          onChange={(e) => onMuscleGroupChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="all">All</option>
          {Object.values(MuscleGroup).map((mg) => (
            <option key={mg} value={mg}>
              {mg}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Equipment</label>
        <select
          value={equipment}
          onChange={(e) => onEquipmentChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="all">All</option>
          {Object.values(Equipment).map((eq) => (
            <option key={eq} value={eq}>
              {eq}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => onDifficultyChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="all">All</option>
          {Object.values(Difficulty).map((diff) => (
            <option key={diff} value={diff}>
              {diff}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
