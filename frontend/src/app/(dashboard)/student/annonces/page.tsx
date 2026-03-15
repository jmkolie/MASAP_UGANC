'use client'
import { useState, useEffect } from 'react'
import { Bell, Pin } from 'lucide-react'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { formatDateTime } from '@/lib/utils'
import api from '@/lib/api'
import type { Announcement } from '@/types'

export default function AnnoncesPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Announcement | null>(null)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true)
      try {
        const res = await api.get('/announcements', { params: { page, per_page: 10 } })
        setAnnouncements(res.data.items || [])
        setTotal(res.data.total || 0)
        setPages(res.data.pages || 1)
      } catch { } finally {
        setLoading(false)
      }
    }
    fetchAnnouncements()
  }, [page])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Annonces</h1>
        <p className="text-gray-500 text-sm mt-1">{total} annonce(s) disponible(s)</p>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* List */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
            {announcements.length === 0 ? (
              <div className="py-16">
                <EmptyState icon={Bell} title="Aucune annonce" />
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {announcements.map((ann) => (
                  <button
                    key={ann.id}
                    onClick={() => setSelected(ann)}
                    className={`w-full text-left px-5 py-4 transition-colors hover:bg-gray-50 ${selected?.id === ann.id ? 'bg-primary-50 border-l-2 border-primary-600' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {ann.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-2">{ann.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDateTime(ann.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="px-5 py-4 border-t border-gray-100">
              <Pagination page={page} totalPages={pages} onPageChange={setPage} total={total} perPage={10} />
            </div>
          </div>

          {/* Detail */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-card">
            {selected ? (
              <div className="p-6">
                {selected.is_pinned && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Pin className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-medium text-amber-600">Annonce épinglée</span>
                  </div>
                )}
                <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
                <p className="text-xs text-gray-400 mt-2">{formatDateTime(selected.created_at)}</p>
                <hr className="my-4 border-gray-100" />
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selected.content}
                </div>
              </div>
            ) : (
              <div className="py-20">
                <EmptyState
                  icon={Bell}
                  title="Sélectionnez une annonce"
                  description="Cliquez sur une annonce dans la liste pour afficher son contenu."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
