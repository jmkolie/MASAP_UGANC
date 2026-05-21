'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
}

export function Checkbox({
  label,
  description,
  className,
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || props.name
  
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex items-center">
        <input
          type="checkbox"
          id={checkboxId}
          className={cn(
            'peer sr-only',
            className
          )}
          {...props}
        />
        <div
          className={cn(
            'w-5 h-5 border-2 border-gray-300 rounded transition-all duration-150',
            'peer-checked:bg-primary-700 peer-checked:border-primary-700',
            'peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2',
            'group-hover:border-primary-400'
          )}
        >
          <Check
            className={cn(
              'w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'opacity-0 peer-checked:opacity-100 transition-opacity duration-150'
            )}
          />
        </div>
      </div>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              {label}
            </span>
          )}
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
    </label>
  )
}
