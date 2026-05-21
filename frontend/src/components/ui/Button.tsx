import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  icon?: LucideIcon
  loading?: boolean
  children: React.ReactNode
}

const variantStyles = {
  primary: 'bg-primary-700 text-white hover:bg-primary-800 shadow-sm',
  secondary: 'bg-white text-primary-900 border border-primary-100 hover:bg-primary-50 shadow-sm',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  ghost: 'text-primary-700 hover:bg-primary-50',
  outline: 'border border-primary-200 text-primary-800 hover:bg-primary-50',
}

const sizeStyles = {
  sm: 'px-3 py-2 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-5 py-3 text-base rounded-xl',
  icon: 'w-10 h-10 rounded-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : Icon ? (
        <Icon className={cn('w-4 h-4', size === 'sm' && 'w-3.5 h-3.5')} />
      ) : null}
      {children}
    </button>
  )
}
