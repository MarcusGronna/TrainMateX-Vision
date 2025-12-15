import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/programs')({
  beforeLoad: ({ location }) => {
    // Only redirect if we're at exactly /programs, not child routes
    if (location.pathname === '/programs') {
      throw redirect({ to: '/' })
    }
  },
  component: () => <Outlet />,
})
