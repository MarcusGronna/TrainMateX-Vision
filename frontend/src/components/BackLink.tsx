import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { Link, type LinkProps } from '@tanstack/react-router'

interface BackLinkProps {
  to: LinkProps['to']
  label: string
  params?: LinkProps['params']
}

export function BackLink({ to, label, params }: BackLinkProps) {
  return (
    <Link
      to={to}
      params={params}
      className="text-sm text-indigo-600 hover:text-indigo-800"
    >
      {/* Don't change this */}
      <FontAwesomeIcon icon={faArrowLeft} size="sm" />
      {label}
    </Link>
  )
}
