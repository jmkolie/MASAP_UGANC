'use client'
import { useState, useEffect } from 'react'
import { Plus, Megaphone, Pin, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import type { Announcement } from '@/types'

const AUDIENCE_LABELS: Record<string, string> = {
  all: 'Tous',
  students: 'Étudiants',
  teachers: 'Enseignants',
  department: 'Département',
}

export default function AdminAnnoncesPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Announcement | null>(null)
  const [form, setForm] = useState({ title: '', content: '', audience: 'all', is_pinned: false })

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements')
      setAnnouncements(res.data.items || res.data || [])
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/announcements', form)
      toast.success('Annonce publiée !')
      setShowForm(false)
      setForm({ title: '', content: '', audience: 'all', is_pinned: false })
      fetchAnnouncements()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur')
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Supprimer l'annonce "${title}" ?`)) return
    try {
      await api.delete(`/announcements/${id}`)
      toast.success('Annonce supprimée')
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch { toast.error('Erreur') }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Annonces</h1>
          <p className="text-gray-500 text-sm mt-0.5">{announcements.length} annonce(s)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />Nouvelle annonce
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Nouvelle annonce</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Titre</label>
              <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Contenu</label>
              <textarea className="form-input" rows={4} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Audience</label>
              <select className="form-input" value={form.audience} onChange={e => setForm({...form, audience: e.target.value})}>
                {Object.entries(AUDIENCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="pin" checked={form.is_pinned} onChange={e => setForm({...form, is_pinned: e.target.checked})} className="rounded" />
              <label htmlFor="pin" className="text-sm text-gray-700 cursor-pointer flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-amber-500" />Épingler
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Publier</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-2">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card py-10">
              <EmptyState icon={Megaphone} title="Aucune annonce" />
            </div>
          ) : (
            announcements.map(a => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className={`w-full text-left p-4 rounded-xl border shadow-card transition-all ${selected?.id === a.id ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{a.title}</p>
                  {a.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{a.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{formatDate(a.created_at)}</span>
                  <span className="badge bg-gray-100 text-gray-500 border-gray-200 text-xs">{AUDIENCE_LABELS[a.audience] || a.audience}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {selected.is_pinned && <Pin className="w-4 h-4 text-amber-500" />}
                    <h2 className="text-lg font-bold text-gray-900">{selected.title}</h2>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDate(selected.created_at)} · {AUDIENCE_LABELS[selected.audience] || selected.audience}
                  </p>
                </div>
                <button onClick={() => handleDelete(selected.id, selected.title)} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{selected.content}</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sélectionnez une annonce</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
