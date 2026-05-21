import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-100 shadow-card',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('px-5 py-4 border-b border-gray-100', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
  icon?: LucideIcon
  action?: React.ReactNode
}

export function CardTitle({ children, className, icon: Icon, action }: CardTitleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-primary-600" />}
        <h3 className={cn('text-base font-semibold text-gray-800', className)}>
          {children}
        </h3>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('px-5 py-4', className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('px-5 py-4 border-t border-gray-100 bg-gray-50/50', className)}>
      {children}
    </div>
  )
}
