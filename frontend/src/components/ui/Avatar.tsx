import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface AvatarProps {
  src?: string
  alt?: string
  initials?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackColor?: 'primary' | 'gray' | 'blue' | 'green' | 'amber' | 'purple'
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const colorStyles = {
  primary: 'bg-primary-700 text-white',
  gray: 'bg-gray-200 text-gray-600',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
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
        'rounded-full overflow-hidden flex items-center justify-center font-semibold flex-shrink-0',
        sizeStyles[size],
        colorStyles[fallbackColor],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials || '?'}</span>
      )}
    </div>
  )
}

interface AvatarGroupProps {
  avatars: { src?: string; initials?: string; alt?: string }[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const displayedAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={cn('flex items-center', className)}>
      {displayedAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          {...avatar}
          size={size}
          className={cn(
            'border-2 border-white -ml-2 first:ml-0',
            index >= 1 && '-ml-2'
          )}
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold border-2 border-white -ml-2',
            sizeStyles[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
