'use client'
import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getDayName } from '@/lib/utils'
import api from '@/lib/api'
import type { Schedule, Module, Cohort } from '@/types'

const DAYS = [1, 2, 3, 4, 5]
const SESSION_TYPES: Record<string, { label: string; color: string }> = {
  course: { label: 'Cours', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  td: { label: 'TD', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  tp: { label: 'TP', color: 'bg-green-100 text-green-700 border-green-200' },
  exam: { label: 'Examen', color: 'bg-red-100 text-red-700 border-red-200' },
}

export default function DeptHeadEmploiDuTempsPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    module_id: '', cohort_id: '', day_of_week: '1',
    start_time: '08:00', end_time: '10:00',
    room: '', schedule_type: 'course', meeting_link: ''
  })

  const fetchSchedules = async () => {
    try {
      const res = await api.get('/schedule')
      setSchedules(res.data || [])
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    Promise.all([fetchSchedules(), api.get('/academic/modules'), api.get('/academic/cohorts')])
      .then(([_, modRes, cohRes]) => {
        setModules(modRes.data || [])
        setCohorts(cohRes.data || [])
      })
      .catch(() => {})
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/schedule', {
        ...form,
        module_id: parseInt(form.module_id),
        cohort_id: form.cohort_id ? parseInt(form.cohort_id) : null,
        day_of_week: parseInt(form.day_of_week),
      })
      toast.success('Créneau ajouté !')
      setShowForm(false)
      fetchSchedules()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce créneau ?')) return
    try {
      await api.delete(`/schedule/${id}`)
      toast.success('Créneau supprimé')
      setSchedules(prev => prev.filter(s => s.id !== id))
    } catch { toast.error('Erreur') }
  }

  if (loading) return <PageLoader />

  const byDay = DAYS.map(d => ({
    day: d,
    sessions: schedules.filter(s => s.day_of_week === d).sort((a, b) => a.start_time.localeCompare(b.start_time))
  }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emploi du temps</h1>
          <p className="text-gray-500 text-sm mt-0.5">Planning hebdomadaire du département</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />Nouveau créneau
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Nouveau créneau</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Module</label>
              <select className="form-input" value={form.module_id} onChange={e => setForm({...form, module_id: e.target.value})} required>
                <option value="">Sélectionner...</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Promotion</label>
              <select className="form-input" value={form.cohort_id} onChange={e => setForm({...form, cohort_id: e.target.value})}>
                <option value="">Toutes</option>
                {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Jour</label>
              <select className="form-input" value={form.day_of_week} onChange={e => setForm({...form, day_of_week: e.target.value})}>
                {DAYS.map(d => <option key={d} value={d}>{getDayName(d)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Heure de début</label>
              <input type="time" className="form-input" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Heure de fin</label>
              <input type="time" className="form-input" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Type</label>
              <select className="form-input" value={form.schedule_type} onChange={e => setForm({...form, schedule_type: e.target.value})}>
                {Object.entries(SESSION_TYPES).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Salle</label>
              <input className="form-input" placeholder="Amphi A..." value={form.room} onChange={e => setForm({...form, room: e.target.value})} />
            </div>
            <div>
              <label className="form-label">Lien de réunion (opt.)</label>
              <input type="url" className="form-input" placeholder="https://..." value={form.meeting_link} onChange={e => setForm({...form, meeting_link: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Créer</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {schedules.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card py-16">
          <EmptyState icon={Clock} title="Aucun créneau planifié" />
        </div>
      ) : (
        <div className="space-y-4">
          {byDay.filter(d => d.sessions.length > 0).map(({ day, sessions }) => (
            <div key={day} className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-semibold text-gray-700">{getDayName(day)}</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {sessions.map(s => {
                  const mod = modules.find(m => m.id === s.module_id)
                  const cohort = cohorts.find(c => c.id === s.cohort_id)
                  const type = SESSION_TYPES[s.schedule_type] || { label: s.schedule_type, color: 'bg-gray-100 text-gray-500 border-gray-200' }
                  return (
                    <div key={s.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="text-xs font-mono text-gray-500 w-24 flex-shrink-0">
                          {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{mod?.name || '—'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`badge ${type.color}`}>{type.label}</span>
                            {s.room && <span className="text-xs text-gray-400">{s.room}</span>}
                            {cohort && <span className="text-xs text-gray-400">· {cohort.name}</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded text-red-400 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
