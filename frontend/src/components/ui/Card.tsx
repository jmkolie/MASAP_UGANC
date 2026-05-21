import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return <div className={cn('rounded-xl border border-primary-100 bg-white shadow-card', paddingStyles[padding], className)}>{children}</div>
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('border-b border-primary-100 px-5 py-4', className)}>{children}</div>
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('border-t border-primary-100 bg-primary-50/30 px-5 py-4', className)}>{children}</div>
}

export function CardTitle({
  children,
  icon: Icon,
  action,
  className,
}: {
  children: React.ReactNode
  icon?: LucideIcon
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-primary-700" />}
        <h3 className={cn('text-base font-semibold text-gray-800', className)}>{children}</h3>
      </div>
      {action}
    </div>
  )
}
