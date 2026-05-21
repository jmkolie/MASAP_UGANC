import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  icon?: LucideIcon
  loading?: boolean
  children: React.ReactNode
}

const variantStyles = {
  primary: 'bg-primary-700 hover:bg-primary-800 text-white shadow-sm',
  secondary: 'bg-white hover:bg-primary-50 text-primary-900 border border-primary-200 shadow-sm',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  ghost: 'hover:bg-primary-50 text-primary-700',
  outline: 'border-2 border-primary-200 hover:bg-primary-50 text-primary-700',
  link: 'text-primary-700 hover:text-primary-900 underline-offset-4 hover:underline',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && Icon && <Icon className={cn('w-4 h-4', size === 'sm' ? 'w-3 h-3' : '')} />}
      {children}
    </button>
  )
}
