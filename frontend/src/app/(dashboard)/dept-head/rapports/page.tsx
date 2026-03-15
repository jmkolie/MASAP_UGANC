'use client'
import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, BookMarked, Award, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { getGradeColor, getMention } from '@/lib/utils'
import api from '@/lib/api'
import type { DashboardStats, Module, Program } from '@/types'

interface ModuleResult {
  id: number
  module_id: number
  student_id: number
  student_name: string
  student_matricule: string
  average: number | null
  is_passed: boolean
  credits_earned: number
}

export default function RapportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [results, setResults] = useState<ModuleResult[]>([])
  const [resultsLoading, setResultsLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/academic/dashboard-stats'),
      api.get('/academic/modules'),
      api.get('/academic/programs'),
    ])
      .then(([statsRes, modRes, progRes]) => {
        setStats(statsRes.data)
        setModules(modRes.data || [])
        setPrograms(progRes.data || [])
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const handleLoadResults = async () => {
    if (!selectedModule) return
    setResultsLoading(true)
    try {
      const res = await api.get(`/grades/results/module/${selectedModule}`)
      const data = res.data || []
      if (data.length === 0) toast('Aucun résultat calculé pour ce module. Calculez d\'abord les moyennes.', { icon: 'ℹ️' })
      setResults(data)
    } catch { toast.error('Erreur lors du chargement des résultats') }
    finally { setResultsLoading(false) }
  }

  const handleDownloadPV = async () => {
    if (!selectedModule) return
    try {
      const res = await api.get(`/pdf/pv/${selectedModule}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      const mod = modules.find(m => String(m.id) === selectedModule)
      a.download = `PV_${mod?.code || selectedModule}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      const msg = err?.response?.data ? await err.response.data.text?.() : ''
      toast.error(msg || 'Calculez d\'abord les moyennes avant de générer le PV')
    }
  }

  if (loading) return <PageLoader />

  const passRate = results.length > 0
    ? Math.round(results.filter(r => r.is_passed).length / results.length * 100)
    : null
  const validAvgs = results.filter(r => r.average !== null).map(r => r.average as number)
  const avgScore = validAvgs.length > 0
    ? (validAvgs.reduce((sum, v) => sum + v, 0) / validAvgs.length).toFixed(2)
    : null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports & Statistiques</h1>
        <p className="text-gray-500 text-sm mt-0.5">Vue d'ensemble académique du département</p>
      </div>

      {/* Global stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 text-center">
            <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{stats.total_students}</p>
            <p className="text-xs text-gray-500">Étudiants</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 text-center">
            <BookMarked className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{stats.total_modules}</p>
            <p className="text-xs text-gray-500">Modules</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{stats.validated_modules ?? '—'}</p>
            <p className="text-xs text-gray-500">Modules validés</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 text-center">
            <Award className="w-6 h-6 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{stats.active_academic_year || '—'}</p>
            <p className="text-xs text-gray-500">Année courante</p>
          </div>
        </div>
      )}

      {/* Per-module report */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-gray-700">Résultats par module</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <select className="form-input w-auto flex-1 min-w-48" value={selectedModule} onChange={e => setSelectedModule(e.target.value)}>
            <option value="">Sélectionner un module...</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
          </select>
          <button onClick={handleLoadResults} disabled={!selectedModule} className="btn-primary disabled:opacity-50">
            Charger
          </button>
          <button onClick={handleDownloadPV} disabled={!selectedModule} className="btn-secondary flex items-center gap-2 disabled:opacity-50">
            <Download className="w-4 h-4" />PV PDF
          </button>
        </div>

        {resultsLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!resultsLoading && results.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-700">{results.length}</p>
                <p className="text-xs text-blue-600">Étudiants évalués</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-green-700">{passRate}%</p>
                <p className="text-xs text-green-600">Taux de réussite</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-amber-700">{avgScore}/20</p>
                <p className="text-xs text-amber-600">Moyenne générale</p>
              </div>
            </div>
            <table className="w-full mt-2">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="table-header">Matricule</th>
                  <th className="table-header">Étudiant</th>
                  <th className="table-header text-center">Moyenne</th>
                  <th className="table-header text-center">Mention</th>
                  <th className="table-header text-center">Résultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{r.student_matricule}</span>
                    </td>
                    <td className="table-cell text-sm text-gray-800">{r.student_name}</td>
                    <td className="table-cell text-center">
                      {r.average !== null
                        ? <span className={`font-bold ${getGradeColor(r.average)}`}>{r.average.toFixed(2)}/20</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="table-cell text-center text-xs text-gray-500">
                      {r.average !== null ? getMention(r.average) : '—'}
                    </td>
                    <td className="table-cell text-center">
                      <span className={`badge ${r.is_passed ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {r.is_passed ? 'Validé' : 'Non validé'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
