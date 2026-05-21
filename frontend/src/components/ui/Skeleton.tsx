import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4',
        variant === 'rectangular' && 'h-32',
        className
      )}
    />
  )
}

interface CardSkeletonProps {
  showHeader?: boolean
  showImage?: boolean
  className?: string
}

export function CardSkeleton({ showHeader = true, showImage = false, className }: CardSkeletonProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 shadow-card p-5', className)}>
      {showImage && (
        <Skeleton variant="rectangular" className="mb-4 rounded-lg" />
      )}
      {showHeader && (
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="w-32 h-5" />
        </div>
      )}
      <div className="space-y-2">
        <Skeleton className="w-full" />
        <Skeleton className="w-5/6" />
        <Skeleton className="w-4/6" />
      </div>
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface DashboardSkeletonProps {
  statCount?: number
  className?: string
}

export function DashboardSkeleton({ statCount = 4, className }: DashboardSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-xl p-6">
        <Skeleton className="w-48 h-7 bg-white/20 mb-2" />
        <Skeleton className="w-64 h-4 bg-white/20" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: statCount }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-16 h-8" />
              </div>
              <Skeleton variant="circular" className="w-10 h-10" />
            </div>
          </div>
        ))}
      </div>
      {/* Content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton showHeader />
        <CardSkeleton showHeader />
      </div>
    </div>
  )
}
