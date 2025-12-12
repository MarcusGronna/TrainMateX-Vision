import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/programs/$programId')({
  component: () => <Outlet />,
})
