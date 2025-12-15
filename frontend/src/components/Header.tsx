import { SignedIn } from '@clerk/clerk-react'
import HeaderUser from '@/integrations/clerk/header-user'
import { Link, useLocation } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  // Check if we're on a workout detail page
  const isWorkoutDetailPage = location.pathname.includes('/workouts/')

  return (
    <>
      <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="ml-4 text-xl font-semibold">
          <Link to="/" className="hover:text-indigo-400 transition-colors">
            TrainMateX-Vision
          </Link>
        </h1>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="text-xl font-bold hover:text-indigo-400 transition-colors"
          >
            TrainMateX-Vision
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <SignedIn>
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              activeProps={{ className: 'bg-gray-700' }}
            >
              Training Programs
            </Link>
            <Link
              to="/exercises"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              activeProps={{ className: 'bg-gray-700' }}
            >
              Exercise Library
            </Link>
          </SignedIn>
          {isWorkoutDetailPage && (
            <div className="pt-4 border-t border-gray-700">
              <p className="px-4 py-2 text-sm text-gray-400 uppercase tracking-wide">
                Workout View
              </p>
              <div className="text-sm text-gray-300 px-4 py-2">
                Use the toggle button to switch between workout exercises and
                the exercise library.
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <HeaderUser />
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu overlay"
        />
      )}
    </>
  )
}
