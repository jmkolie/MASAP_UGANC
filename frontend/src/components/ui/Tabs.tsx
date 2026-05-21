'use client'

import { cn } from '@/lib/utils'
import { TabsContentProps, TabsListProps, TabsTriggerProps } from '@radix-ui/react-tabs'

interface TabsProps {
  children: React.ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

export function Tabs({
  children,
  defaultValue,
  value,
  onValueChange,
  className,
}: TabsProps) {
  return (
    <div className={cn('w-full', className)}>
      {children}
    </div>
  )
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 bg-gray-100 p-1 rounded-lg',
        className
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ children, value, className }: TabsTriggerProps) {
  return (
    <button
      data-value={value}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-md transition-all duration-150',
        'text-gray-600 hover:text-gray-900',
        'data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm',
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ children, value, className }: TabsContentProps) {
  return (
    <div
      data-value={value}
      className={cn(
        'mt-4',
        className
      )}
    >
      {children}
    </div>
  )
}
