import { createFileRoute } from '@tanstack/react-router'
import { ProgramDetailPage } from '@/pages/ProgramDetailPage'

export const Route = createFileRoute('/programs/$programId/')({
  component: ProgramDetailPage,
})
