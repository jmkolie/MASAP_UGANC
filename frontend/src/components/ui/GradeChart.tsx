'use client'

import { cn } from '@/lib/utils'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface ChartDataPoint {
  name: string
  value: number
}

export function GradeChart({
  data,
  title,
  className,
  height = 280,
}: {
  data: ChartDataPoint[]
  title?: string
  className?: string
  height?: number
}) {
  return (
    <div className={cn('rounded-xl border border-primary-100 bg-white p-5 shadow-card', className)}>
      {title && <h3 className="text-base font-semibold text-gray-800">{title}</h3>}
      <div className="mt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ead9de" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#8a6b75" />
            <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} stroke="#8a6b75" />
            <Tooltip cursor={{ fill: '#f8ece8' }} />
            <Bar dataKey="value" fill="#531628" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ProgressChart({
  completed,
  total,
  size = 'md',
}: {
  completed: number
  total: number
  size?: 'sm' | 'md'
}) {
  const safeTotal = total <= 0 ? 1 : total
  const percentage = Math.min(100, Math.round((completed / safeTotal) * 100))
  const circle = size === 'sm' ? 56 : 92
  const radius = size === 'sm' ? 22 : 36
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (percentage / 100) * circumference
  const center = circle / 2

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={circle} height={circle} viewBox={`0 0 ${circle} ${circle}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#ead9de" strokeWidth="8" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#531628"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-sm font-bold text-primary-900">{percentage}%</p>
        <p className="text-[10px] text-gray-500">{completed}/{total}</p>
      </div>
    </div>
  )
}

export function ModulePerformance({
  modules,
}: {
  modules: Array<{ name: string; average: number; credits: number; coefficient: number }>
}) {
  return (
    <div className="space-y-3">
      {modules.map((module) => (
        <div key={module.name} className="rounded-xl border border-primary-100 bg-primary-50/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">{module.name}</p>
              <p className="text-xs text-gray-500">
                {module.credits} crédits · coeff. {module.coefficient}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary-900">{module.average.toFixed(2)}</p>
              <p className="text-xs text-gray-500">/20</p>
            </div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary-100">
            <div className="h-full rounded-full bg-primary-700" style={{ width: `${Math.min(100, (module.average / 20) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
