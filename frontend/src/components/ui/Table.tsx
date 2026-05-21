import { cn } from '@/lib/utils'

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">{children}</table>
    </div>
  )
}

export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <thead className={cn('bg-primary-50/60', className)}>{children}</thead>
}

export function TableBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tbody className={cn('divide-y divide-primary-100', className)}>{children}</tbody>
}

export function TableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn('transition-colors hover:bg-primary-50/30', className)}>{children}</tr>
}

export function TableCell({
  children,
  className,
  header = false,
}: {
  children: React.ReactNode
  className?: string
  header?: boolean
}) {
  const Comp = header ? 'th' : 'td'
  return (
    <Comp
      className={cn(
        'px-4 py-3 text-sm',
        header ? 'text-left text-xs font-semibold uppercase tracking-wider text-primary-800' : 'text-gray-700',
        className
      )}
    >
      {children}
    </Comp>
  )
}
