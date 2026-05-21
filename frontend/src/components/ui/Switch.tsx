'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
}

export function Switch({
  label,
  description,
  className,
  id,
  ...props
}: SwitchProps) {
  const switchId = id || props.name
  
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          id={switchId}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            'w-11 h-6 bg-gray-200 rounded-full transition-colors duration-200',
            'peer-checked:bg-primary-700',
            'peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2',
            'group-hover:bg-gray-300 peer-checked:group-hover:bg-primary-800'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
              'peer-checked:translate-x-5'
            )}
          />
        </div>
      </div>
      {(label || description) && (
        <div>
          {label && (
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              {label}
            </span>
          )}
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      )}
    </label>
  )
}
