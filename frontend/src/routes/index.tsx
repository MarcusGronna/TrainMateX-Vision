import { createFileRoute } from '@tanstack/react-router'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { TrainingProgramsPage } from '@/pages/TrainingProgramsPage'
import { LandingPage } from '@/pages/LandingPage'

export const Route = createFileRoute('/')({
  component: IndexRoute,
})

function IndexRoute() {
  return (
    <>
      <SignedIn>
        <TrainingProgramsPage />
      </SignedIn>
      <SignedOut>
        <LandingPage />
      </SignedOut>
    </>
  )
}
