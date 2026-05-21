'use client'

import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  onClose?: () => void
  className?: string
}

const variantStyles = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: <Info className="w-5 h-5 text-blue-600" />,
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: <XCircle className="w-5 h-5 text-red-600" />,
  },
}

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}: AlertProps) {
  const styles = variantStyles[variant]
  
  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex items-start gap-3',
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {styles.icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn('font-semibold mb-1', styles.text)}>
            {title}
          </p>
        )}
        <div className={cn('text-sm', styles.text)}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors',
            styles.text
          )}
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
