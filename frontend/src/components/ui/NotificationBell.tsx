'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import { cn, formatDateTime } from '@/lib/utils'
import type { Notification } from '@/types'
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const notificationVariants = {
  info: {
    icon: Info,
    tone: 'bg-[#e6f0fb] text-[#0e66c2] border-[#b6d4f5]',
    badge: 'info' as const,
  },
  success: {
    icon: CheckCircle2,
    tone: 'bg-green-50 text-green-700 border-green-200',
    badge: 'success' as const,
  },
  warning: {
    icon: AlertTriangle,
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    badge: 'warning' as const,
  },
  error: {
    icon: XCircle,
    tone: 'bg-red-50 text-red-700 border-red-200',
    badge: 'danger' as const,
  },
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Notification[]>([])

  const unreadCount = useMemo(() => items.filter((item) => !item.is_read).length, [items])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await api.get('/announcements/notifications/my', { params: { per_page: 8 } })
      setItems(response.data.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications().catch(() => undefined)
    const interval = window.setInterval(() => {
      fetchNotifications().catch(() => undefined)
    }, 60000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (open) {
      fetchNotifications().catch(() => undefined)
    }
  }, [open])

  const markAsRead = async (notificationId: number) => {
    try {
      await api.put(`/announcements/notifications/${notificationId}/read`)
      setItems((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
        )
      )
    } catch {}
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/announcements/notifications/read-all')
      setItems((current) => current.map((item) => ({ ...item, is_read: true, read_at: item.read_at || new Date().toISOString() })))
    } catch {}
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn('relative text-primary-700', open && 'bg-primary-50')}
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-scale-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Fermer les notifications"
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-2xl animate-slide-in-down">
            <div className="flex items-center justify-between border-b border-primary-100 bg-primary-50/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && <Badge variant="default">{unreadCount}</Badge>}
              </div>
              {unreadCount > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                  <CheckCheck className="h-4 w-4" />
                  Tout lire
                </Button>
              )}
            </div>

            <div className="max-h-[26rem] overflow-y-auto">
              {loading ? (
                <div className="p-5 text-sm text-gray-500">Chargement...</div>
              ) : items.length === 0 ? (
                <div className="p-5 text-sm text-gray-500">Aucune notification pour le moment.</div>
              ) : (
                <div className="divide-y divide-primary-100">
                  {items.map((item) => {
                    const variant = notificationVariants[item.type]
                    const Icon = variant.icon

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(
                          'block w-full px-4 py-3 text-left transition-colors hover:bg-primary-50/30',
                          !item.is_read && 'bg-primary-50/40'
                        )}
                        onClick={() => {
                          markAsRead(item.id)
                          setOpen(false)
                          if (item.link) window.location.href = item.link
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className={cn('mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border', variant.tone)}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                              {!item.is_read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary-700" />}
                            </div>
                            {item.content && <p className="mt-1 text-xs text-gray-500">{item.content}</p>}
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <Badge variant={variant.badge}>{item.type}</Badge>
                              <span className="text-[11px] text-gray-400">{formatDateTime(item.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
