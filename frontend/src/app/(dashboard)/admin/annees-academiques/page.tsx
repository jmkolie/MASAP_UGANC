'use client'
import { useState, useEffect } from 'react'
import { Plus, Calendar, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import type { AcademicYear } from '@/types'

export default function AnneesAcademiquesPage() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', is_current: false })

  const fetchYears = async () => {
    const res = await api.get('/academic/academic-years')
    setYears(res.data || [])
  }

  useEffect(() => {
    fetchYears().catch(() => toast.error('Erreur')).finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/academic/academic-years', form)
      toast.success('Année académique créée !')
      setShowForm(false)
      fetchYears()
    } catch (err: any) { toast.error(err?.response?.data?.detail || 'Erreur') }
  }

  const handleSetCurrent = async (year: AcademicYear) => {
    try {
      await api.put(`/academic/academic-years/${year.id}`, { is_current: true })
      toast.success(`${year.name} définie comme année courante`)
      fetchYears()
    } catch { toast.error('Erreur') }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Années académiques</h1>
          <p className="text-gray-500 text-sm mt-0.5">{years.length} année(s)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" />Nouvelle année
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Nouvelle année académique</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="form-label">Nom (ex: 2025-2026)</label><input className="form-input" placeholder="2025-2026" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><label className="form-label">Date de début</label><input type="date" className="form-input" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required /></div>
            <div><label className="form-label">Date de fin</label><input type="date" className="form-input" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} required /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.is_current} onChange={e => setForm({...form, is_current: e.target.checked})} className="rounded" />
            Définir comme année courante
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Créer</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {years.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-100 shadow-card py-16">
            <EmptyState icon={Calendar} title="Aucune année académique" />
          </div>
        ) : (
          years.map(y => (
            <div key={y.id} className={`bg-white rounded-xl border shadow-card p-5 transition-shadow hover:shadow-card-hover ${y.is_current ? 'border-primary-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-700" />
                </div>
                {y.is_current && (
                  <span className="badge bg-primary-100 text-primary-800 border-primary-200">Courante</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{y.name}</h3>
              <p className="text-xs text-gray-500">{formatDate(y.start_date)} → {formatDate(y.end_date)}</p>
              {!y.is_current && (
                <button
                  onClick={() => handleSetCurrent(y)}
                  className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800"
                >
                  <Check className="w-3.5 h-3.5" />
                  Définir comme courante
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
