import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  clickable?: boolean
  onClick?: () => void
}

/**
 * Card component for consistent container styling across the app.
 *
 * @param hover - Add hover effect (shadow increase)
 * @param clickable - Add cursor pointer and hover background
 */
export function Card({
  children,
  className,
  hover = false,
  clickable = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-4 shadow-sm',
        hover && 'hover:shadow-md transition-shadow',
        clickable && 'cursor-pointer hover:border-indigo-600 transition-all',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn('space-y-1 mb-4', className)}>{children}</div>
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('font-semibold text-gray-900', className)}>{children}</h3>
  )
}

interface CardDescriptionProps {
  children: ReactNode
  className?: string
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return <p className={cn('text-sm text-gray-600', className)}>{children}</p>
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('space-y-4', className)}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return <div className={cn('mt-4 flex gap-2', className)}>{children}</div>
}
