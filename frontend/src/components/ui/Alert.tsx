import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  className?: string
}

const variants = {
  info: {
    container: 'border-[#b6d4f5] bg-[#e6f0fb] text-[#0e66c2]',
    icon: Info,
  },
  success: {
    container: 'border-green-200 bg-green-50 text-green-800',
    icon: CheckCircle2,
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: AlertCircle,
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-800',
    icon: XCircle,
  },
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const Icon = variants[variant].icon

  return (
    <div className={cn('flex items-start gap-3 rounded-xl border p-4', variants[variant].container, className)}>
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  )
}
