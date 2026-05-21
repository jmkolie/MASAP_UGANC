'use client'

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
}

export function Switch({ label, description, id, ...props }: SwitchProps) {
  const switchId = id || props.name

  return (
    <label htmlFor={switchId} className="flex items-center gap-3 cursor-pointer">
      <span className="relative">
        <input id={switchId} type="checkbox" className="peer sr-only" {...props} />
        <span className="block h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-primary-700 peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-medium text-gray-700">{label}</span>}
          {description && <span className="block text-xs text-gray-500">{description}</span>}
        </span>
      )}
    </label>
  )
}
