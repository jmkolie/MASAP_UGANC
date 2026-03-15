'use client'
import { useState, useEffect } from 'react'
import { Plus, Users, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import type { Cohort, Program, AcademicYear } from '@/types'

export default function PromotionsPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', program_id: '', academic_year_id: '', max_students: '35' })

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/academic/cohorts', {
        ...form,
        program_id: parseInt(form.program_id),
        academic_year_id: parseInt(form.academic_year_id),
        max_students: parseInt(form.max_students),
      })
      toast.success('Promotion créée !')
      setShowForm(false)
      setForm({ name: '', program_id: '', academic_year_id: '', max_students: '35' })
      const res = await api.get('/academic/cohorts')
      setCohorts(res.data || [])
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la création')
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-500 text-sm mt-0.5">{cohorts.length} promotion(s)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />Nouvelle promotion
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Nouvelle promotion</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Nom (ex: MSP-M1-2024)</label>
              <input className="form-input" placeholder="MSP-M1-2024" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Programme</label>
              <select className="form-input" value={form.program_id} onChange={e => setForm({...form, program_id: e.target.value})} required>
                <option value="">Sélectionner...</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Année académique</label>
              <select className="form-input" value={form.academic_year_id} onChange={e => setForm({...form, academic_year_id: e.target.value})} required>
                <option value="">Sélectionner...</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Capacité max</label>
              <input type="number" min="1" max="200" className="form-input" value={form.max_students} onChange={e => setForm({...form, max_students: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Créer</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cohorts.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-100 shadow-card py-16">
            <EmptyState icon={GraduationCap} title="Aucune promotion" />
          </div>
        ) : (
          cohorts.map(c => {
            const prog = programs.find(p => p.id === c.program_id)
            const year = years.find(y => y.id === c.academic_year_id)
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-purple-700" />
                  </div>
                  {year && (
                    <span className="badge bg-blue-100 text-blue-700 border-blue-200">{year.name}</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{c.name}</h3>
                {prog && <p className="text-xs text-gray-500 mb-3">{prog.name}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {c.current_students ?? 0} / {c.max_students} étudiants
                  </span>
                </div>
                <a
                  href={`/admin/promotions/${c.id}`}
                  className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800"
                >
                  <Users className="w-3.5 h-3.5" />
                  Voir les étudiants
                </a>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
