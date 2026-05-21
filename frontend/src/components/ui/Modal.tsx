'use client'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={cn('relative w-full max-w-lg rounded-2xl border border-primary-100 bg-white shadow-2xl animate-scale-in', className)}>
        <div className="flex items-center justify-between border-b border-primary-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} className="text-gray-500">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="border-t border-primary-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}
