import { createFileRoute } from '@tanstack/react-router'
import { TrainingProgramsPage } from '@/pages/TrainingProgramsPage'

export const Route = createFileRoute('/')({
  component: TrainingProgramsPage,
})
