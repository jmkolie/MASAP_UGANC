'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, GraduationCap, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { getEnrollmentStatusColor, getEnrollmentStatusLabel } from '@/lib/utils'

interface StudentItem {
  id: number
  first_name: string
  last_name: string
  email: string
  is_active: boolean
  student_profile?: {
    id?: number
    student_id: string
    enrollment_status: string
    promotion_year?: number
    specialty?: string
    program?: {
      id: number
      name: string
      code: string
      level?: number
    }
  }
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/users/students/list?per_page=200')
        setStudents(res.data?.items || [])
      } catch {
        toast.error('Erreur de chargement des étudiants')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()

    return students.filter((student) => {
      const programText = [
        student.student_profile?.program?.name,
        student.student_profile?.program?.code,
        student.student_profile?.specialty,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !query ||
        student.first_name.toLowerCase().includes(query) ||
        student.last_name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.student_profile?.student_id?.toLowerCase().includes(query) ||
        programText.includes(query)

      const matchesStatus =
        !statusFilter || student.student_profile?.enrollment_status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter, students])

  const handleTranscript = async (student: StudentItem) => {
    try {
      const profileId = student.student_profile?.id
      if (!profileId) {
        toast.error('Profil étudiant introuvable')
        return
      }

      const res = await api.get(`/pdf/transcript/${profileId}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      window.open(url, '_blank')
    } catch {
      toast.error('Erreur de génération')
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Étudiants</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Vue dédiée à l’administration des étudiants et de leurs programmes d’inscription
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un étudiant ou un programme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>

        <select
          className="form-input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="suspended">Suspendu</option>
          <option value="graduated">Diplômé</option>
          <option value="abandoned">Abandonné</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <span className="text-sm font-medium text-gray-700">
            {filteredStudents.length} étudiant(s)
          </span>
        </div>

        <table className="w-full">
          <thead className="border-b border-gray-100">
            <tr>
              <th className="table-header">Étudiant</th>
              <th className="table-header">Matricule</th>
              <th className="table-header">Email</th>
              <th className="table-header">Programme</th>
              <th className="table-header">Spécialité</th>
              <th className="table-header text-center">Statut</th>
              <th className="table-header text-center">Promo</th>
              <th className="table-header text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-sm text-gray-400">
                  Aucun étudiant trouvé
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                        {student.first_name[0]}{student.last_name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {student.first_name} {student.last_name}
                        </div>
                        {!student.is_active && (
                          <div className="text-xs text-amber-600">Compte inactif</div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="table-cell font-mono text-xs text-gray-500">
                    {student.student_profile?.student_id || '—'}
                  </td>

                  <td className="table-cell text-sm text-gray-500">{student.email}</td>

                  <td className="table-cell text-sm text-gray-600">
                    {student.student_profile?.program ? (
                      <div>
                        <div className="font-medium text-gray-800">
                          {student.student_profile.program.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {student.student_profile.program.code}
                          {student.student_profile.program.level
                            ? ` • Niveau ${student.student_profile.program.level}`
                            : ''}
                        </div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="table-cell text-sm text-gray-500">
                    {student.student_profile?.specialty || '—'}
                  </td>

                  <td className="table-cell text-center">
                    {student.student_profile ? (
                      <span className={`badge ${getEnrollmentStatusColor(student.student_profile.enrollment_status)}`}>
                        {getEnrollmentStatusLabel(student.student_profile.enrollment_status)}
                      </span>
                    ) : '—'}
                  </td>

                  <td className="table-cell text-center text-sm text-gray-500">
                    {student.student_profile?.promotion_year || '—'}
                  </td>

                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTranscript(student)}
                        className="rounded p-1.5 text-blue-500 transition-colors hover:bg-blue-50"
                        title="Télécharger relevé de notes"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-4 text-sm text-primary-900">
        <div className="flex items-start gap-3">
          <GraduationCap className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-700" />
          <p>
            Cette vue isole les étudiants de la liste générique des utilisateurs pour permettre
            un suivi administratif centré sur le programme, la spécialité et le statut d’inscription.
          </p>
        </div>
      </div>
    </div>
  )
}
