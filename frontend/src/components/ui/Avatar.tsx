import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  alt?: string
  initials?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackColor?: 'primary' | 'gray' | 'blue' | 'green' | 'amber'
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
}

const colorStyles = {
  primary: 'bg-primary-700 text-white',
  gray: 'bg-gray-200 text-gray-600',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
}

export function Avatar({
  src,
  alt = '',
  initials,
  size = 'md',
  className,
  fallbackColor = 'primary',
}: AvatarProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-full font-semibold flex items-center justify-center flex-shrink-0',
        sizeStyles[size],
        colorStyles[fallbackColor],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{initials || '?'}</span>
      )}
    </div>
  )
}
