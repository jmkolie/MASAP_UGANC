'use client'
import { useEffect, useState } from 'react'
import { Users, BookOpen, GraduationCap, BookMarked, TrendingUp, Activity } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { DashboardStats } from '@/types'

interface AuditLog {
  id: number
  action: string
  entity_type?: string
  details?: string
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          api.get('/academic/dashboard-stats'),
          api.get('/users/audit-logs?per_page=8'),
        ])
        setStats(statsRes.data)
        setLogs(logsRes.data.items || [])
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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Administration</h1>
        <p className="text-gray-500 text-sm mt-1">
          Vue d'ensemble de la plateforme — {stats?.active_academic_year || 'N/A'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Étudiants"
          value={stats?.total_students ?? 0}
          icon={GraduationCap}
          description="Inscrits au total"
          color="blue"
        />
        <StatCard
          title="Enseignants"
          value={stats?.total_teachers ?? 0}
          icon={Users}
          description="Membres du corps enseignant"
          color="green"
        />
        <StatCard
          title="Programmes"
          value={stats?.total_programs ?? 0}
          icon={BookOpen}
          description="Programmes actifs"
          color="amber"
        />
        <StatCard
          title="Modules"
          value={stats?.total_modules ?? 0}
          icon={BookMarked}
          description="Unités d'enseignement"
          color="purple"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          title="Promotions"
          value={stats?.total_cohorts ?? 0}
          icon={Activity}
          description="Cohortes gérées"
          color="blue"
        />
        <StatCard
          title="Inscriptions"
          value={stats?.enrollments_count ?? 0}
          icon={TrendingUp}
          description="Inscriptions pédagogiques"
          color="green"
        />
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-card">
          <p className="text-sm font-medium text-gray-500 mb-1">Année Académique Active</p>
          <p className="text-xl font-bold text-primary-700">
            {stats?.active_academic_year || 'Aucune'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Année en cours</p>
        </div>
      </div>

      {/* Activity log */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Journal d'activité récent</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              Aucune activité récente
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="px-6 py-3 flex items-start gap-4">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-400 mt-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                    {log.entity_type && (
                      <span className="text-gray-400"> — {log.entity_type}</span>
                    )}
                  </p>
                  {log.details && (
                    <p className="text-xs text-gray-400 truncate">{log.details}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDateTime(log.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
