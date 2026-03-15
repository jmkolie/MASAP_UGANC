'use client'
import { useState, useEffect } from 'react'
import { Star, TrendingUp } from 'lucide-react'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import { getGradeColor, getMention, formatGrade } from '@/lib/utils'
import api from '@/lib/api'

interface ModuleGrade {
  id: number
  name: string
  code: string
  credits: number
  coefficient: number
  average?: number
  is_passed?: boolean
  credits_earned: number
  is_validated: boolean
}

export default function MesNotesPage() {
  const { user } = useAuth()
  const [modules, setModules] = useState<ModuleGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [academicYear, setAcademicYear] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.student_profile?.id) { setLoading(false); return }
      try {
        const res = await api.get(`/grades/transcript/${user.student_profile.id}`)
        setModules(res.data.modules || [])
        setAcademicYear(res.data.academic_year || '')
      } catch {
        // Not critical
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  if (loading) return <PageLoader />

  const validated = modules.filter((m) => m.average !== null && m.average !== undefined)
  const overall = validated.length > 0
    ? validated.reduce((s, m) => s + (m.average || 0), 0) / validated.length
    : null
  const creditsEarned = modules.reduce((s, m) => s + m.credits_earned, 0)
  const totalCredits = modules.reduce((s, m) => s + m.credits, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes notes</h1>
        <p className="text-gray-500 text-sm mt-1">Résultats académiques — {academicYear}</p>
      </div>

      {/* Summary */}
      {overall !== null && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-primary-100 shadow-card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Moyenne générale</p>
            <p className={`text-3xl font-bold mt-1 ${getGradeColor(overall)}`}>
              {overall.toFixed(2)}<span className="text-base text-gray-400">/20</span>
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{getMention(overall)}</p>
          </div>
          <div className="bg-white rounded-xl border border-green-100 shadow-card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Crédits obtenus</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {creditsEarned}<span className="text-base text-gray-400">/{totalCredits}</span>
            </p>
            <p className="text-sm text-gray-500 mt-0.5">ECTS validés</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Modules</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">
              {modules.filter((m) => m.is_passed).length}<span className="text-base text-gray-400">/{modules.length}</span>
            </p>
            <p className="text-sm text-gray-500 mt-0.5">Modules validés</p>
          </div>
        </div>
      )}

      {/* Grades table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Détail par module</h2>
        </div>
        {modules.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={Star}
              title="Aucune note disponible"
              description="Vos notes apparaîtront ici une fois validées par le jury."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="table-header">Code</th>
                  <th className="table-header">Module</th>
                  <th className="table-header text-center">Crédits</th>
                  <th className="table-header text-center">Coeff.</th>
                  <th className="table-header text-center">Moyenne /20</th>
                  <th className="table-header text-center">Mention</th>
                  <th className="table-header text-center">Résultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {modules.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-mono text-xs text-gray-500">{m.code}</td>
                    <td className="table-cell font-medium text-gray-800">{m.name}</td>
                    <td className="table-cell text-center text-gray-600">{m.credits}</td>
                    <td className="table-cell text-center text-gray-600">{m.coefficient}</td>
                    <td className="table-cell text-center">
                      {m.average !== undefined && m.average !== null ? (
                        <span className={`text-base font-bold ${getGradeColor(m.average)}`}>
                          {m.average.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="table-cell text-center text-sm text-gray-600">
                      {getMention(m.average)}
                    </td>
                    <td className="table-cell text-center">
                      {m.is_validated ? (
                        <span className={`badge ${m.is_passed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                          {m.is_passed ? 'Validé' : 'Ajourné'}
                        </span>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-600 border-gray-200">En attente</span>
                      )}
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
