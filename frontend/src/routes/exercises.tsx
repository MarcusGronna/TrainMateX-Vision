import { createFileRoute } from '@tanstack/react-router'
import { ExerciseLibraryPage } from '@/pages/ExerciseLibraryPage'

export const Route = createFileRoute('/exercises')({
  component: ExerciseLibraryPage,
})
