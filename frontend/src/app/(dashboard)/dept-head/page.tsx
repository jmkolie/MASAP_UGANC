'use client'
import { useState, useEffect } from 'react'
import { Users, BookMarked, CheckSquare, FileText, TrendingUp, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/ui/StatCard'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import type { DashboardStats } from '@/types'

export default function DeptHeadDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/academic/dashboard-stats')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user?.first_name} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Espace Responsable Pédagogique — {stats?.active_academic_year || ''}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Étudiants" value={stats?.total_students ?? 0} icon={GraduationCap} color="blue" />
        <StatCard title="Enseignants" value={stats?.total_teachers ?? 0} icon={Users} color="green" />
        <StatCard title="Modules" value={stats?.total_modules ?? 0} icon={BookMarked} color="amber" />
        <StatCard title="Promotions" value={stats?.total_cohorts ?? 0} icon={TrendingUp} color="purple" />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Valider les notes', href: '/dept-head/validation-notes', icon: CheckSquare, color: 'bg-green-50 text-green-700' },
            { label: 'Générer PV', href: '/dept-head/pv', icon: FileText, color: 'bg-blue-50 text-blue-700' },
            { label: 'Promotions', href: '/dept-head/promotions', icon: GraduationCap, color: 'bg-amber-50 text-amber-700' },
            { label: 'Rapports', href: '/dept-head/rapports', icon: TrendingUp, color: 'bg-purple-50 text-purple-700' },
          ].map(({ label, href, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl ${color} hover:opacity-80 transition-opacity`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
