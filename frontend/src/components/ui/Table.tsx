import { cn } from '@/lib/utils'

interface TableProps {
  children: React.ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">{children}</table>
    </div>
  )
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn('bg-gray-50', className)}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className }: TableProps) {
  return (
    <tbody className={cn('divide-y divide-gray-100', className)}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr
      className={cn(
        'hover:bg-gray-50 transition-colors',
        className
      )}
    >
      {children}
    </tr>
  )
}

export function TableCell({
  children,
  className,
  variant = 'default',
}: TableProps & { variant?: 'default' | 'header' }) {
  const Component = variant === 'header' ? 'th' : 'td'
  return (
    <Component
      className={cn(
        'px-4 py-3 text-sm',
        variant === 'header'
          ? 'text-left text-xs font-semibold text-gray-700 uppercase tracking-wider'
          : 'text-gray-700',
        className
      )}
    >
      {children}
    </Component>
  )
}
