'use client'
import { useState, useEffect } from 'react'
import { BookMarked, Star, Download, Bell, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/ui/StatCard'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { GradeChart, ModulePerformance, ProgressChart } from '@/components/ui/GradeChart'
import { useAuth } from '@/contexts/AuthContext'
import { getGradeColor, getMention, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import type { Module, Announcement } from '@/types'

interface ModuleResult {
  module_id: number
  module_name: string
  module_code: string
  average?: number
  is_passed?: boolean
  credits_earned: number
  coefficient?: number
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [results, setResults] = useState<ModuleResult[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modRes, annRes] = await Promise.all([
          api.get('/academic/my-enrolled-modules'),
          api.get('/announcements?per_page=5'),
        ])
        setModules(modRes.data || [])
        setAnnouncements(annRes.data.items || [])

        // Try to get transcript data
        if (user?.student_profile?.id) {
          const transcriptRes = await api.get(`/grades/transcript/${user.student_profile.id}`)
          const modulesData = transcriptRes.data.modules || []
          setResults(modulesData.map((m: any) => ({
            module_id: m.id,
            module_name: m.name,
            module_code: m.code,
            average: m.average,
            is_passed: m.is_passed,
            credits_earned: m.credits_earned,
            coefficient: m.coefficient || 1,
          })))
        }
      } catch {
        // Non-critical errors
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  if (loading) return <PageLoader />

  const validatedResults = results.filter((r) => r.average !== null && r.average !== undefined)
  const programName = user?.student_profile?.program?.name || 'Programme non renseigné'
  const overallAvg = validatedResults.length > 0
    ? validatedResults.reduce((sum, r) => sum + (r.average || 0), 0) / validatedResults.length
    : null
  const creditsEarned = results.reduce((sum, r) => sum + r.credits_earned, 0)
  const totalCredits = modules.reduce((sum, module) => sum + module.credits, 0) || 120
  const chartData = validatedResults.slice(0, 8).map((result) => ({
    name: result.module_code || result.module_name.slice(0, 12),
    value: result.average || 0,
  }))
  const passedCount = validatedResults.filter((result) => result.is_passed).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold animate-slide-in-up">Bonjour, {user?.first_name} !</h1>
        <p className="text-blue-200 mt-1 text-sm">
          {user?.student_profile?.student_id && (
            <span className="mr-3">Matricule : <strong>{user.student_profile.student_id}</strong></span>
          )}
          {programName}
        </p>
        {overallAvg !== null && (
          <div className="mt-4 flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-blue-200 text-xs">Moyenne générale</p>
              <p className="text-3xl font-bold">{overallAvg.toFixed(2)}<span className="text-lg text-blue-200">/20</span></p>
              <p className="text-blue-200 text-xs">{getMention(overallAvg)}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs">Crédits obtenus</p>
              <p className="text-3xl font-bold">{creditsEarned}</p>
              <p className="text-blue-200 text-xs">ECTS</p>
            </div>
            <div className="ml-auto">
              <ProgressChart completed={creditsEarned} total={totalCredits} size="sm" />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Modules inscrits" value={modules.length} icon={BookMarked} color="blue" />
        <StatCard title="Notes disponibles" value={validatedResults.length} icon={Star} color="green" />
        <StatCard title="Crédits obtenus" value={creditsEarned} icon={TrendingUp} color="amber" />
        <StatCard title="Annonces" value={announcements.length} icon={Bell} color="purple" />
      </div>

      {validatedResults.length > 0 && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <GradeChart data={chartData} title="Performance par module" className="animate-scale-in" />
          <div className="rounded-xl border border-primary-100 bg-white p-5 shadow-card animate-scale-in">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Taux de réussite</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {passedCount} module(s) validé(s) sur {validatedResults.length}
                </p>
              </div>
              <ProgressChart completed={passedCount} total={validatedResults.length} />
            </div>

            <div className="mt-5">
              <ModulePerformance
                modules={validatedResults.slice(0, 4).map((result) => ({
                  name: result.module_name,
                  average: result.average || 0,
                  credits: result.credits_earned,
                  coefficient: result.coefficient || 1,
                }))}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent grades */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Mes notes récentes</h2>
            <Link href="/student/mes-notes" className="text-xs text-primary-600 hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {validatedResults.length === 0 ? (
              <div className="py-8">
                <EmptyState title="Aucune note disponible" description="Les notes seront disponibles après les délibérations." />
              </div>
            ) : (
              validatedResults.slice(0, 5).map((r) => (
                <div key={r.module_id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.module_name}</p>
                    <p className="text-xs text-gray-400">{r.module_code}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getGradeColor(r.average)}`}>
                      {r.average?.toFixed(2) ?? 'N/A'}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.is_passed ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                      {r.is_passed ? 'Validé' : 'Ajourné'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Annonces</h2>
            <Link href="/student/annonces" className="text-xs text-primary-600 hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {announcements.length === 0 ? (
              <div className="py-8">
                <EmptyState title="Aucune annonce" />
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="px-6 py-3">
                  <div className="flex items-start gap-2">
                    {ann.is_pinned && (
                      <span className="flex-shrink-0 mt-0.5 w-2 h-2 bg-amber-400 rounded-full" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{ann.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(ann.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Accès rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Mes notes', href: '/student/mes-notes', icon: Star, color: 'bg-blue-50 text-blue-700' },
            { label: 'Mes relevés', href: '/student/mes-releves', icon: Download, color: 'bg-green-50 text-green-700' },
            { label: 'Documents', href: '/student/documents', icon: BookMarked, color: 'bg-amber-50 text-amber-700' },
            { label: 'Emploi du temps', href: '/student/emploi-du-temps', icon: Clock, color: 'bg-purple-50 text-purple-700' },
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
