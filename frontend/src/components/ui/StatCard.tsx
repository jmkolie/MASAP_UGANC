import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red'
  className?: string
}

const colorMap = {
  blue: {
    bg: 'bg-primary-50',
    icon: 'bg-primary-100 text-primary-700',
    border: 'border-primary-100',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-700',
    border: 'border-green-100',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-700',
    border: 'border-amber-100',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-700',
    border: 'border-purple-100',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-700',
    border: 'border-red-100',
  },
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'blue',
  className,
}: StatCardProps) {
  const colors = colorMap[color]
  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-shadow',
        colors.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
