import { SignInButton } from '@clerk/clerk-react'

export function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-indigo-50 via-white to-purple-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                TrainMateX
              </span>
              <br />
              <span className="text-gray-900">Vision</span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl sm:text-2xl text-gray-600">
              Your intelligent training companion powered by computer vision
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-6">
            <p className="text-lg text-gray-700">
              Track your workouts, manage training programs, and optimize your
              fitness journey with AI-powered form analysis and personalized
              recommendations.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex items-center justify-center pt-8">
            <SignInButton mode="modal">
              <button className="w-full sm:w-auto rounded-lg bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                Get Started
              </button>
            </SignInButton>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 inline-flex rounded-lg bg-indigo-100 p-3">
              <svg
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Training Programs
            </h3>
            <p className="text-gray-600">
              Create and manage structured workout programs tailored to your
              fitness goals and experience level.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 inline-flex rounded-lg bg-purple-100 p-3">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Exercise Library
            </h3>
            <p className="text-gray-600">
              Access a comprehensive database of exercises with detailed
              instructions, muscle groups, and difficulty levels.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 inline-flex rounded-lg bg-green-100 p-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Progress Tracking
            </h3>
            <p className="text-gray-600">
              Track sets, reps, and weights for every exercise. Monitor your
              progress and adjust your training over time.
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-24 text-center">
          <div className="inline-flex flex-col items-center space-y-4 rounded-2xl border bg-gradient-to-br from-indigo-50 to-purple-50 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">
              Ready to transform your training?
            </h2>
            <p className="text-gray-600">
              Join TrainMateX-Vision and take your fitness to the next level.
            </p>
            <SignInButton mode="modal">
              <button className="rounded-lg bg-indigo-600 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                Sign In Now
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    </div>
  )
}
