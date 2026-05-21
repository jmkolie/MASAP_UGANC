import { cn } from '@/lib/utils'

export function Skeleton({
  className,
  variant = 'text',
}: {
  className?: string
  variant?: 'text' | 'circle' | 'rect'
}) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded bg-[linear-gradient(90deg,#ece7e1_0%,#f7f2ed_40%,#ece7e1_80%)] bg-[length:200%_100%]',
        variant === 'text' && 'h-4',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-xl',
        className
      )}
    />
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-primary-100 bg-white p-5 shadow-card', className)}>
      <Skeleton className="h-5 w-32" />
      <div className="mt-4 space-y-3">
        <Skeleton className="w-full" />
        <Skeleton className="w-5/6" />
        <Skeleton className="w-3/5" />
      </div>
    </div>
  )
}
