import { Link, type LinkProps } from '@tanstack/react-router'

interface BackLinkProps extends Omit<LinkProps, 'children'> {
  label?: string
}

export function BackLink({ label = 'Back', ...props }: BackLinkProps) {
  return (
    <Link
      {...props}
      className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
    >
      <span>←</span>
      {label}
    </Link>
  )
}
