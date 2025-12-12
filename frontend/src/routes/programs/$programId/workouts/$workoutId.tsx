import { WorkoutDetailPage } from '@/pages/WorkoutDetailPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/programs/$programId/workouts/$workoutId',
)({
  component: WorkoutDetailPage,
})
