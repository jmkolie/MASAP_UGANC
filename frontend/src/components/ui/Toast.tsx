'use client'

import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'

interface ToastProps {
  id: string
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose: (id: string) => void
}

const typeStyles = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-primary-700',
  warning: 'bg-amber-500',
}

const typeIcons = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
}

export function Toast({ id, message, type = 'info', duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px] max-w-md',
        'animate-in slide-in-from-right fade-in duration-200',
        typeStyles[type]
      )}
    >
      {typeIcons[type]}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="p-1 hover:bg-white/20 rounded transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>
  removeToast: (id: string) => void
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </div>
  )
}

// Simple toast hook
let toastListeners: Array<(toast: { id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }) => void> = []
let toastIdCounter = 0

export function useToast() {
  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `toast-${++toastIdCounter}`
    const toast = { id, message, type }
    toastListeners.forEach((listener) => listener(toast))
    return id
  }

  const removeToast = (id: string) => {
    toastListeners.forEach((listener) => listener({ id, message: '', type: 'info' }))
  }

  return { addToast, removeToast }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>>([])

  const handleToast = (toast: { id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }) => {
    if (toast.message === '') {
      // Remove toast
      setToasts((prev) => prev.filter((t) => t.id !== toast.id))
    } else {
      // Add toast
      setToasts((prev) => [...prev, toast])
    }
  }

  useEffect(() => {
    toastListeners.push(handleToast)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== handleToast)
    }
  }, [])

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} removeToast={(id) => handleToast({ id, message: '', type: 'info' })} />
    </>
  )
}
