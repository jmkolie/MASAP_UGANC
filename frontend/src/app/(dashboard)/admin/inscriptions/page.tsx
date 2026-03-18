'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { UserCheck, UserX, Mail, Phone, Calendar, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

interface PendingStudent {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  created_at: string
  student_profile?: { student_id: string }
}

export default function InscriptionsPage() {
  const [students, setStudents] = useState<PendingStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users/students/pending')
      setStudents(res.data.items ?? [])
    } catch {
      toast.error('Erreur lors du chargement des inscriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPending() }, [])

  const approve = async (id: number, name: string) => {
    setProcessing(id)
    try {
      await api.post(`/users/students/${id}/approve`)
      toast.success(`Compte de ${name} activé`)
      setStudents(prev => prev.filter(s => s.id !== id))
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la validation')
    } finally {
      setProcessing(null)
    }
  }

  const reject = async (id: number, name: string) => {
    if (!confirm(`Rejeter l'inscription de ${name} ? Cette action est irréversible.`)) return
    setProcessing(id)
    try {
      await api.post(`/users/students/${id}/reject`)
      toast.success(`Inscription de ${name} rejetée`)
      setStudents(prev => prev.filter(s => s.id !== id))
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors du rejet')
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inscriptions en attente</h1>
          <p className="text-sm text-gray-500 mt-1">
            Validez ou rejetez les demandes d'inscription des étudiants.
          </p>
        </div>
        <button
          onClick={fetchPending}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <UserCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Aucune inscription en attente</p>
          <p className="text-sm text-gray-400 mt-1">Toutes les demandes ont été traitées.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Counter badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-amber-100 text-amber-800 text-sm font-semibold px-3 py-1 rounded-full">
              {students.length} demande{students.length > 1 ? 's' : ''} en attente
            </span>
          </div>

          {students.map(student => (
            <div
              key={student.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                {student.first_name.charAt(0)}{student.last_name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">
                  {student.first_name} {student.last_name}
                </p>
                {student.student_profile?.student_id && (
                  <p className="text-xs text-primary-600 font-mono mb-1">
                    {student.student_profile.student_id}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Mail className="w-3.5 h-3.5" />
                    {student.email}
                  </span>
                  {student.phone && (
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Phone className="w-3.5 h-3.5" />
                      {student.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(student.created_at)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => approve(student.id, `${student.first_name} ${student.last_name}`)}
                  disabled={processing === student.id}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {processing === student.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  Valider
                </button>
                <button
                  onClick={() => reject(student.id, `${student.first_name} ${student.last_name}`)}
                  disabled={processing === student.id}
                  className="flex items-center gap-1.5 border border-red-300 hover:bg-red-50 disabled:opacity-50 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <UserX className="w-4 h-4" />
                  Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
