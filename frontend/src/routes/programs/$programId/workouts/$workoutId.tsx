import { createFileRoute } from '@tanstack/react-router'
import { WorkoutDetailPage } from '@/pages/WorkoutDetailPage'

export const Route = createFileRoute(
  '/programs/$programId/workouts/$workoutId',
)({
  component: WorkoutDetailPage,
})
