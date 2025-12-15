import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionTitleProps {
  children: ReactNode
  className?: string
  description?: string
  action?: ReactNode
}

/**
 * SectionTitle component for consistent section headers across the app.
 *
 * @param description - Optional subtitle/description text
 * @param action - Optional action button (e.g., "Add", "Create")
 */
export function SectionTitle({
  children,
  className,
  description,
  action,
}: SectionTitleProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl font-semibold text-gray-900 truncate">
          {children}
        </h1>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

interface PageTitleProps {
  children: ReactNode
  className?: string
}

export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <h1 className={cn('text-2xl font-semibold text-gray-900', className)}>
      {children}
    </h1>
  )
}

interface SectionSubtitleProps {
  children: ReactNode
  className?: string
}

export function SectionSubtitle({ children, className }: SectionSubtitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h2>
  )
}
