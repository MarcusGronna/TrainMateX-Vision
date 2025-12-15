import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/programs')({
  beforeLoad: () => {
    // Redirect to index since programs list is at /
    throw redirect({ to: '/' })
  },
})
