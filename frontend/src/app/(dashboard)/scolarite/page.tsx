'use client'
import { useState, useEffect } from 'react'
import { Users, GraduationCap, FileText, BookMarked, Upload, Search, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { StatCard } from '@/components/ui/StatCard'
import { formatDate, getEnrollmentStatusColor, getEnrollmentStatusLabel } from '@/lib/utils'
import api from '@/lib/api'
import type { DashboardStats } from '@/types'

interface StudentItem {
  id: number
  first_name: string
  last_name: string
  email: string
  is_active: boolean
  student_profile_id?: number
  student_profile?: {
    id?: number
    student_id: string
    enrollment_status: string
    promotion_year?: number
  }
}

export default function ScolaritePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [importLoading, setImportLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/academic/dashboard-stats'),
      api.get('/users/students/list'),
    ])
      .then(([statsRes, studRes]) => {
        setStats(statsRes.data)
        setStudents(studRes.data?.items || studRes.data || [])
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const matchQ = !q || s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q)
      || s.student_profile?.student_id?.toLowerCase().includes(q)
    const matchStatus = !statusFilter || s.student_profile?.enrollment_status === statusFilter
    return matchQ && matchStatus
  })

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/users/import-students-csv', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success(`${res.data.created} étudiant(s) importé(s)`)
      const studRes = await api.get('/users/students/list')
      setStudents(studRes.data?.items || studRes.data || [])
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur d\'importation')
    } finally {
      setImportLoading(false)
      e.target.value = ''
    }
  }

  const handleTranscript = async (student: StudentItem) => {
    try {
      const profileId = student.student_profile?.id || student.student_profile_id
      if (!profileId) { toast.error('Profil étudiant introuvable'); return }
      const res = await api.get(`/pdf/transcript/${profileId}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      window.open(url, '_blank')
    } catch { toast.error('Erreur de génération') }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scolarité</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gestion administrative des étudiants</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Étudiants" value={stats.total_students} icon={Users} color="blue" />
          <StatCard title="Enseignants" value={stats.total_teachers} icon={GraduationCap} color="green" />
          <StatCard title="Modules" value={stats.total_modules} icon={BookMarked} color="purple" />
          <StatCard title="Programmes" value={stats.total_programs} icon={FileText} color="amber" />
        </div>
      )}

      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un étudiant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <select className="form-input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="suspended">Suspendu</option>
          <option value="graduated">Diplômé</option>
          <option value="withdrawn">Retiré</option>
        </select>
        <label className={`flex items-center gap-2 btn-secondary cursor-pointer ${importLoading ? 'opacity-60 pointer-events-none' : ''}`}>
          <Upload className="w-4 h-4" />
          {importLoading ? 'Import...' : 'Importer CSV'}
          <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </label>
      </div>

      {/* Students table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{filtered.length} étudiant(s)</span>
        </div>
        <table className="w-full">
          <thead className="border-b border-gray-100">
            <tr>
              <th className="table-header">Étudiant</th>
              <th className="table-header">Matricule</th>
              <th className="table-header">Email</th>
              <th className="table-header text-center">Statut</th>
              <th className="table-header text-center">Promo</th>
              <th className="table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-sm text-gray-400">Aucun étudiant trouvé</td>
              </tr>
            ) : (
              filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
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
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTranscript(s)}
                        className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition-colors"
                        title="Télécharger relevé de notes"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
