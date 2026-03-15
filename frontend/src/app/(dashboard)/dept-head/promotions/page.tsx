'use client'
import { useState, useEffect } from 'react'
import { Users, GraduationCap, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getEnrollmentStatusColor, getEnrollmentStatusLabel } from '@/lib/utils'
import api from '@/lib/api'
import type { Cohort, Program, AcademicYear } from '@/types'

interface StudentItem {
  id: number
  first_name: string
  last_name: string
  email: string
  student_profile?: {
    student_id: string
    enrollment_status: string
  }
}

export default function DeptHeadPromotionsPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [students, setStudents] = useState<StudentItem[]>([])
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null)
  const [loading, setLoading] = useState(true)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/academic/cohorts'),
      api.get('/academic/programs'),
      api.get('/academic/academic-years'),
    ])
      .then(([cohRes, progRes, yearRes]) => {
        setCohorts(cohRes.data || [])
        setPrograms(progRes.data || [])
        setYears(yearRes.data || [])
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const handleSelectCohort = async (cohort: Cohort) => {
    setSelectedCohort(cohort)
    setStudentsLoading(true)
    try {
      const res = await api.get(`/academic/cohorts/${cohort.id}/students`)
      setStudents(res.data || [])
    } catch { setStudents([]) }
    finally { setStudentsLoading(false) }
  }

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return !q || s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q)
      || s.student_profile?.student_id?.toLowerCase().includes(q)
  })

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gestion des promotions du département</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cohort list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide px-1">Promotions</h2>
          {cohorts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card py-10">
              <EmptyState icon={GraduationCap} title="Aucune promotion" />
            </div>
          ) : (
            cohorts.map(c => {
              const prog = programs.find(p => p.id === c.program_id)
              const year = years.find(y => y.id === c.academic_year_id)
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectCohort(c)}
                  className={`w-full text-left p-4 rounded-xl border shadow-card transition-all ${selectedCohort?.id === c.id ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-purple-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">{prog?.name || '—'} · {year?.name || '—'}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    {c.current_students ?? 0} / {c.max_students} étudiants
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Students list */}
        <div className="lg:col-span-2">
          {selectedCohort ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-gray-700">{selectedCohort.name} — {filtered.length} étudiant(s)</h2>
                <div className="relative max-w-xs flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-8 py-1.5 text-sm" />
                </div>
              </div>
              {studentsLoading ? (
                <div className="py-16 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16"><EmptyState icon={Users} title="Aucun étudiant" /></div>
              ) : (
                <table className="w-full">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="table-header">#</th>
                      <th className="table-header">Étudiant</th>
                      <th className="table-header">Matricule</th>
                      <th className="table-header text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((s, i) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="table-cell text-xs text-gray-400">{i + 1}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">
                              {s.first_name[0]}{s.last_name[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{s.first_name} {s.last_name}</p>
                              <p className="text-xs text-gray-400">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell font-mono text-xs text-gray-500">{s.student_profile?.student_id || '—'}</td>
                        <td className="table-cell text-center">
                          {s.student_profile ? (
                            <span className={`badge ${getEnrollmentStatusColor(s.student_profile.enrollment_status)}`}>
                              {getEnrollmentStatusLabel(s.student_profile.enrollment_status)}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Sélectionnez une promotion</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
