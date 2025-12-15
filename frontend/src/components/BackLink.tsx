import { Link } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

interface BackLinkProps {
  to: string
  label?: string
}

export function BackLink({ to, label = 'Back' }: BackLinkProps) {
  return (
    <Link
      to={to as any}
      className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
    >
      <FontAwesomeIcon icon={faArrowLeft} size="sm" />
      {label}
    </Link>
  )
}
