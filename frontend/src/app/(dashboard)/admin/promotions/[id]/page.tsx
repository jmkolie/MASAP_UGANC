'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, GraduationCap, Mail, Phone, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getRoleLabel } from '@/lib/utils'
import api from '@/lib/api'
import type { User, Cohort } from '@/types'

export default function CohortStudentsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [cohort, setCohort] = useState<Cohort | null>(null)
  const [students, setStudents] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/academic/cohorts/${id}`),
      api.get(`/academic/cohorts/${id}/students`),
    ])
      .then(([cohRes, stuRes]) => {
        setCohort(cohRes.data)
        setStudents(stuRes.data || [])
        setFiltered(stuRes.data || [])
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!search.trim()) { setFiltered(students); return }
    const term = search.toLowerCase()
    setFiltered(students.filter(s =>
      s.first_name.toLowerCase().includes(term) ||
      s.last_name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.student_profile?.student_id?.toLowerCase().includes(term)
    ))
  }, [search, students])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{cohort?.name || 'Promotion'}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{students.length} étudiant(s) inscrit(s)</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un étudiant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={GraduationCap} title="Aucun étudiant" description="Aucun étudiant trouvé dans cette promotion." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="table-header">Matricule</th>
                  <th className="table-header">Nom complet</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Téléphone</th>
                  <th className="table-header">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {s.student_profile?.student_id || '—'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">
                          {s.first_name[0]}{s.last_name[0]}
                        </div>
                        <span className="font-medium text-gray-800">{s.first_name} {s.last_name}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 text-sm">
                        <Mail className="w-3.5 h-3.5" />{s.email}
                      </a>
                    </td>
                    <td className="table-cell text-gray-500">
                      {s.phone ? (
                        <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{s.phone}</span>
                      ) : '—'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        s.student_profile?.enrollment_status === 'active'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : s.student_profile?.enrollment_status === 'graduated'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {s.student_profile?.enrollment_status === 'active' ? 'Actif'
                          : s.student_profile?.enrollment_status === 'graduated' ? 'Diplômé'
                          : s.student_profile?.enrollment_status === 'suspended' ? 'Suspendu'
                          : 'Abandonné'}
                      </span>
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
