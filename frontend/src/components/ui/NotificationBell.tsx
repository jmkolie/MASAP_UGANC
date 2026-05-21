'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, X, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { Badge } from './Badge'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

export interface Notification {
  id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  created_at: string
  link?: string
}

const typeColors = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
}

const typeIcons = {
  info: <Bell className="w-4 h-4" />,
  success: <Check className="w-4 h-4" />,
  warning: <Bell className="w-4 h-4" />,
  error: <X className="w-4 h-4" />,
}

interface NotificationBellProps {
  showCount?: boolean
}

export function NotificationBell({ showCount = true }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications?per_page=10')
      const items = res.data.items || []
      setNotifications(items)
      setUnreadCount(items.filter((n: Notification) => !n.is_read).length)
    } catch {
      // Non-critical
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // Non-critical
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      // Non-critical
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg text-primary-700 hover:bg-primary-50 transition-colors',
          isOpen && 'bg-primary-50'
        )}
      >
        <Bell className="w-5 h-5" />
        {showCount && unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-red-500 text-white text-xs font-bold rounded-full animate-in zoom-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-primary-100 z-50 overflow-hidden animate-in slide-in-from-top fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="default">{unreadCount}</Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-500 mt-2">Chargement...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 hover:bg-gray-50 transition-colors cursor-pointer group',
                        !notification.is_read && 'bg-blue-50/30'
                      )}
                      onClick={() => {
                        markAsRead(notification.id)
                        if (notification.link) {
                          window.location.href = notification.link
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border',
                          typeColors[notification.type]
                        )}>
                          {typeIcons[notification.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              'text-sm font-medium truncate',
                              !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                            )}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {notification.link && (
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-colors flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <a
                href="/notifications"
                className="flex items-center justify-center gap-2 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Voir toutes les notifications
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
