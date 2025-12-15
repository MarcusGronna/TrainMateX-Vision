import { Link } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

interface BackLinkProps {
  to: string
  label: string
  params?: Record<string, string>
}

export function BackLink({ to, label, params }: BackLinkProps) {
  return (
    <Link
      to={to as any}
      params={params}
      className="text-sm text-indigo-600 hover:text-indigo-800"
    >
      <FontAwesomeIcon icon={faArrowLeft} size="sm" />
      {label}
    </Link>
  )
}
