'use client'
import { useState, useEffect } from 'react'
import { BookMarked, Users, ClipboardList, Bell } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Module, Announcement } from '@/types'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulesRes, annRes] = await Promise.all([
          api.get('/academic/my-modules'),
          api.get('/announcements?per_page=5'),
        ])
        setModules(modulesRes.data || [])
        setAnnouncements(annRes.data.items || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user?.first_name} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Bienvenue dans votre espace enseignant</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Mes modules" value={modules.length} icon={BookMarked} color="blue" />
        <StatCard title="Étudiants" value="—" icon={Users} description="Tous mes groupes" color="green" />
        <StatCard title="Notes à saisir" value="—" icon={ClipboardList} color="amber" />
        <StatCard title="Annonces" value={announcements.length} icon={Bell} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Modules */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Mes modules</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {modules.length === 0 ? (
              <div className="py-8">
                <EmptyState title="Aucun module assigné" description="Contactez le chef de département." />
              </div>
            ) : (
              modules.map((m) => (
                <div key={m.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.code} — {m.credits} crédits</p>
                  </div>
                  <span className={`badge ${m.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {m.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Annonces récentes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {announcements.length === 0 ? (
              <div className="py-8">
                <EmptyState title="Aucune annonce" />
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="px-6 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {ann.is_pinned && (
                        <span className="badge bg-amber-100 text-amber-700 border-amber-200 mb-1">Épinglé</span>
                      )}
                      <p className="text-sm font-medium text-gray-800 truncate">{ann.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ann.content}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(ann.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
