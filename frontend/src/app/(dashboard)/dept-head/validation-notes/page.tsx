'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Play } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import api from '@/lib/api'
import type { Module, AcademicYear } from '@/types'

export default function ValidationNotesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modRes, yearsRes] = await Promise.all([
          api.get('/academic/modules'),
          api.get('/academic/academic-years'),
        ])
        setModules(modRes.data || [])
        const yearList = yearsRes.data || []
        setYears(yearList)
        const current = yearList.find((y: AcademicYear) => y.is_current)
        if (current) setSelectedYear(current.id)
      } catch {
        toast.error('Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleCalculate = async (moduleId: number) => {
    if (!selectedYear) return
    setActionInProgress(moduleId)
    try {
      await api.post(`/grades/results/calculate?module_id=${moduleId}&academic_year_id=${selectedYear}`)
      toast.success('Moyennes calculées !')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors du calcul')
    } finally {
      setActionInProgress(null)
    }
  }

  const handleValidate = async (moduleId: number) => {
    if (!selectedYear) return
    setActionInProgress(moduleId)
    try {
      await api.post(`/grades/validate/${moduleId}?academic_year_id=${selectedYear}`)
      toast.success('Notes validées !')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la validation')
    } finally {
      setActionInProgress(null)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Validation des notes</h1>
        <p className="text-gray-500 text-sm mt-1">
          Calculez les moyennes et validez les notes par module
        </p>
      </div>

      {/* Year selector */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <label className="text-sm font-medium text-gray-700 mr-3">Année académique :</label>
        <select
          value={selectedYear || ''}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name} {y.is_current ? '(Courante)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Module list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{modules.length} module(s)</h2>
        </div>
        {modules.length === 0 ? (
          <div className="py-16">
            <EmptyState title="Aucun module" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="table-header">Code</th>
                  <th className="table-header">Module</th>
                  <th className="table-header text-center">Crédits</th>
                  <th className="table-header text-center">Statut</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {modules.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-xs text-gray-500">{m.code}</td>
                    <td className="table-cell font-medium text-gray-800">{m.name}</td>
                    <td className="table-cell text-center text-gray-600">{m.credits}</td>
                    <td className="table-cell text-center">
                      <span className="badge bg-amber-100 text-amber-700 border-amber-200">
                        En cours
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCalculate(m.id)}
                          disabled={actionInProgress === m.id || !selectedYear}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-60 transition-colors"
                        >
                          {actionInProgress === m.id ? (
                            <div className="w-3.5 h-3.5 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          Calculer
                        </button>
                        <button
                          onClick={() => handleValidate(m.id)}
                          disabled={actionInProgress === m.id || !selectedYear}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-60 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Valider
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
