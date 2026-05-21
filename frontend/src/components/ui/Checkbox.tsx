'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
}

export function Checkbox({ label, description, className, id, ...props }: CheckboxProps) {
  const checkboxId = id || props.name

  return (
    <label htmlFor={checkboxId} className="flex items-start gap-3 cursor-pointer group">
      <span className="relative mt-0.5 flex-shrink-0">
        <input id={checkboxId} type="checkbox" className={cn('peer sr-only', className)} {...props} />
        <span className="flex h-5 w-5 items-center justify-center rounded border-2 border-gray-300 bg-white transition-colors peer-checked:border-primary-700 peer-checked:bg-primary-700 peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2">
          <Check className="h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>}
          {description && <span className="mt-0.5 block text-xs text-gray-500">{description}</span>}
        </span>
      )}
    </label>
  )
}
