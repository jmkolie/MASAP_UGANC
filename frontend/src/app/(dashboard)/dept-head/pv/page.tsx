'use client'
import { useState, useEffect } from 'react'
import { Download, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import api from '@/lib/api'
import type { Module, AcademicYear } from '@/types'

export default function PVPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<number | null>(null)

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

  const downloadPV = async (moduleId: number, moduleName: string) => {
    if (!selectedYear) { toast.error('Sélectionnez une année académique'); return }
    setDownloading(moduleId)
    try {
      const res = await api.get(`/pdf/pv/${moduleId}?academic_year_id=${selectedYear}`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `PV_${moduleName.replace(/\s+/g, '_')}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('PV téléchargé !')
    } catch {
      toast.error('Erreur lors de la génération du PV')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Génération des PV</h1>
        <p className="text-gray-500 text-sm mt-1">
          Générez les procès-verbaux de délibération par module
        </p>
      </div>

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

      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Modules disponibles</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {modules.map((m) => (
            <div key={m.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.code} — {m.credits} crédits</p>
                </div>
              </div>
              <button
                onClick={() => downloadPV(m.id, m.name)}
                disabled={downloading === m.id}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white rounded-lg transition-colors"
              >
                {downloading === m.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Télécharger PV
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
