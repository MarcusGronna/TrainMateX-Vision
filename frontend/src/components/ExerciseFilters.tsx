import { humanizeEnum } from '@/lib/humanizeEnum'
import { DIFFICULTIES, EQUIPMENT, MUSCLE_GROUPS } from '@/lib/exerciseEnums'

interface ExerciseFiltersProps {
  muscleGroup: string
  setMuscleGroup: (value: string) => void
  equipment: string
  setEquipment: (value: string) => void
  difficulty: string
  setDifficulty: (value: string) => void
  search: string
  setSearch: (value: string) => void
}

export function ExerciseFilters({
  muscleGroup,
  setMuscleGroup,
  equipment,
  setEquipment,
  difficulty,
  setDifficulty,
  search,
  setSearch,
}: ExerciseFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <select
        className="rounded-md border border-gray-300 px-3 py-2 bg-white"
        value={muscleGroup}
        onChange={(e) => setMuscleGroup(e.target.value)}
      >
        <option value="">All Muscle Groups</option>
        {MUSCLE_GROUPS.map((mg) => (
          <option key={mg} value={mg}>
            {humanizeEnum(mg)}
          </option>
        ))}
      </select>

      <select
        className="rounded-md border border-gray-300 px-3 py-2 bg-white"
        value={equipment}
        onChange={(e) => setEquipment(e.target.value)}
      >
        <option value="">All Equipment</option>
        {EQUIPMENT.map((eq) => (
          <option key={eq} value={eq}>
            {humanizeEnum(eq)}
          </option>
        ))}
      </select>

      <select
        className="rounded-md border border-gray-300 px-3 py-2 bg-white"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
      >
        <option value="">All Difficulties</option>
        {DIFFICULTIES.map((diff) => (
          <option key={diff} value={diff}>
            {diff}
          </option>
        ))}
      </select>

      <input
        className="rounded-md border border-gray-300 px-3 py-2"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name..."
      />
    </div>
  )
}
