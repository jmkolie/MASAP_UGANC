'use client'
import { useState, useEffect } from 'react'
import { Search, Users, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getEnrollmentStatusColor, getEnrollmentStatusLabel } from '@/lib/utils'
import api from '@/lib/api'
import type { Module } from '@/types'

interface StudentItem {
  id: number
  first_name: string
  last_name: string
  email: string
  student_profile?: {
    student_id: string
    enrollment_status: string
    promotion_year?: number
  }
}

export default function MesEtudiantsPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [selectedModule, setSelectedModule] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/academic/my-modules')
      .then(res => {
        const mods = res.data || []
        setModules(mods)
        if (mods.length > 0) {
          setSelectedModule(mods[0].id)
        }
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedModule) return
    setStudentsLoading(true)
    api.get(`/academic/modules/${selectedModule}/students`)
      .then(res => setStudents(res.data || []))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false))
  }, [selectedModule])

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return !q || s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q)
      || s.student_profile?.student_id?.toLowerCase().includes(q)
  })

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes étudiants</h1>
        <p className="text-gray-500 text-sm mt-0.5">Liste des étudiants inscrits à vos modules</p>
      </div>

      {/* Module selector */}
      <div className="flex flex-wrap gap-2">
        {modules.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedModule(m.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${selectedModule === m.id ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}
          >
            {m.name}
          </button>
        ))}
        {modules.length === 0 && (
          <p className="text-sm text-gray-400">Aucun module assigné</p>
        )}
      </div>

      {selectedModule && (
        <>
          {/* Search + count */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un étudiant..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input pl-9"
              />
            </div>
            <span className="text-sm text-gray-500">{filtered.length} étudiant(s)</span>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
            {studentsLoading ? (
              <div className="py-16 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16"><EmptyState icon={Users} title="Aucun étudiant inscrit" /></div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="table-header">#</th>
                    <th className="table-header">Étudiant</th>
                    <th className="table-header">Matricule</th>
                    <th className="table-header">Email</th>
                    <th className="table-header text-center">Statut</th>
                    <th className="table-header text-center">Promo</th>
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
                          <span className="font-medium text-gray-800 text-sm">{s.first_name} {s.last_name}</span>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-xs text-gray-500">{s.student_profile?.student_id || '—'}</td>
                      <td className="table-cell text-sm text-gray-500">{s.email}</td>
                      <td className="table-cell text-center">
                        {s.student_profile ? (
                          <span className={`badge ${getEnrollmentStatusColor(s.student_profile.enrollment_status)}`}>
                            {getEnrollmentStatusLabel(s.student_profile.enrollment_status)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="table-cell text-center text-sm text-gray-500">
                        {s.student_profile?.promotion_year || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
