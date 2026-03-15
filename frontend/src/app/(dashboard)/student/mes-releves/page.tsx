'use client'
import { useState, useEffect } from 'react'
import { Download, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'

interface AcademicYear {
  id: number
  name: string
  is_current: boolean
}

export default function MesRelevesPage() {
  const { user } = useAuth()
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<number | null>(null)

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await api.get('/academic/academic-years')
        setYears(res.data || [])
      } catch { } finally {
        setLoading(false)
      }
    }
    fetchYears()
  }, [])

  const downloadTranscript = async (yearId?: number) => {
    if (!user?.student_profile?.id) return
    setDownloading(yearId || 0)
    try {
      const url = yearId
        ? `/pdf/transcript/${user.student_profile.id}?academic_year_id=${yearId}`
        : `/pdf/transcript/${user.student_profile.id}`
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      const year = years.find(y => y.id === yearId)
      link.download = `releve_${user.student_profile?.student_id}_${year?.name || 'complet'}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('Relevé téléchargé !')
    } catch {
      toast.error('Erreur lors du téléchargement du relevé')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes relevés de notes</h1>
        <p className="text-gray-500 text-sm mt-1">
          Téléchargez vos relevés de notes officiels en format PDF
        </p>
      </div>

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">À propos de vos relevés</p>
            <p className="text-xs text-blue-600 mt-1">
              Les relevés de notes sont générés automatiquement à partir des résultats validés par le jury.
              Seules les notes validées apparaissent sur le document officiel.
            </p>
          </div>
        </div>
      </div>

      {/* Student info */}
      {user?.student_profile && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Informations étudiant</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400">Nom complet</p>
              <p className="text-sm font-medium text-gray-800">
                {user.first_name} {user.last_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Matricule</p>
              <p className="text-sm font-medium text-gray-800 font-mono">
                {user.student_profile.student_id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Download options */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Télécharger un relevé</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {/* Cumulative transcript */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Relevé cumulatif</p>
              <p className="text-xs text-gray-400">Toutes les années académiques</p>
            </div>
            <button
              onClick={() => downloadTranscript(undefined)}
              disabled={downloading === 0}
              className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {downloading === 0 ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Télécharger PDF
            </button>
          </div>

          {/* By academic year */}
          {years.map((year) => (
            <div key={year.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Relevé {year.name}
                  {year.is_current && (
                    <span className="ml-2 badge bg-green-100 text-green-700 border-green-200">Année courante</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">Relevé pour l'année {year.name}</p>
              </div>
              <button
                onClick={() => downloadTranscript(year.id)}
                disabled={downloading === year.id}
                className="flex items-center gap-2 border border-primary-300 text-primary-700 hover:bg-primary-50 disabled:opacity-60 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {downloading === year.id ? (
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Télécharger
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
