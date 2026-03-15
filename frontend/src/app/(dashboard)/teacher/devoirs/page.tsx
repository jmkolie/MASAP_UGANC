'use client'
import { useState, useEffect, useRef } from 'react'
import { Plus, ClipboardList, ChevronDown, ChevronUp, Users, Paperclip, Download, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import type { Module } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Assignment {
  id: number
  title: string
  description: string
  module_id: number
  due_date: string
  max_score: number
  is_active: boolean
  file_path?: string | null
  submission_count?: number
}

export default function DevoirsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [form, setForm] = useState({ title: '', description: '', module_id: '', due_date: '', max_score: '20' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/grades/assignments')
      setAssignments(res.data || [])
    } catch { /* no assignments yet */ }
  }

  useEffect(() => {
    Promise.all([fetchAssignments(), api.get('/academic/my-modules')])
      .then(([_, modRes]) => setModules(modRes.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.post('/grades/assignments', {
        ...form,
        module_id: parseInt(form.module_id),
        max_score: parseFloat(form.max_score),
        is_active: true,
      })
      const newId = res.data.id
      if (selectedFile && newId) {
        const fd = new FormData()
        fd.append('file', selectedFile)
        await api.post(`/grades/assignments/${newId}/file`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      toast.success('Devoir créé !')
      setShowForm(false)
      setForm({ title: '', description: '', module_id: '', due_date: '', max_score: '20' })
      setSelectedFile(null)
      fetchAssignments()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (a: Assignment) => {
    try {
      await api.put(`/grades/assignments/${a.id}`, { is_active: !a.is_active })
      toast.success(a.is_active ? 'Devoir désactivé' : 'Devoir réactivé')
      fetchAssignments()
    } catch { toast.error('Erreur') }
  }

  const handleAttachFile = async (a: Assignment, file: File) => {
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/grades/assignments/${a.id}/file`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Fichier joint')
      fetchAssignments()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de l\'upload')
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devoirs</h1>
          <p className="text-gray-500 text-sm mt-0.5">{assignments.length} devoir(s)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />Nouveau devoir
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Nouveau devoir</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Titre</label>
              <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Module</label>
              <select className="form-input" value={form.module_id} onChange={e => setForm({...form, module_id: e.target.value})} required>
                <option value="">Sélectionner...</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Date limite</label>
              <input type="datetime-local" className="form-input" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Note maximale</label>
              <input type="number" min="1" max="100" step="0.5" className="form-input" value={form.max_score} onChange={e => setForm({...form, max_score: e.target.value})} />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Description / consignes</label>
              <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Consignes détaillées du devoir..." />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Fichier joint (optionnel)</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                  {selectedFile ? selectedFile.name : 'Joindre un fichier'}
                </button>
                {selectedFile && (
                  <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Création...' : 'Créer'}</button>
            <button type="button" onClick={() => { setShowForm(false); setSelectedFile(null) }} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-card py-16">
            <EmptyState icon={ClipboardList} title="Aucun devoir créé" />
          </div>
        ) : (
          assignments.map(a => {
            const mod = modules.find(m => m.id === a.module_id)
            const isExpanded = expanded === a.id
            const isPast = new Date(a.due_date) < new Date()
            return (
              <div key={a.id} className={`bg-white rounded-xl border shadow-card overflow-hidden transition-all ${a.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(isExpanded ? null : a.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                      <p className="text-xs text-gray-400">{mod?.name || '—'} · Limite : {formatDate(a.due_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.file_path && <Paperclip className="w-3.5 h-3.5 text-gray-400" aria-label="Fichier joint" />}
                    <span className={`badge ${isPast ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                      {isPast ? 'Expiré' : 'En cours'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Users className="w-3.5 h-3.5" />
                      {a.submission_count ?? 0} rendu(s)
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-50 px-4 py-3 bg-gray-50/50 space-y-3">
                    {a.description && <p className="text-sm text-gray-600">{a.description}</p>}
                    <p className="text-xs text-gray-400">Note max : {a.max_score} pts</p>

                    {/* Attached file */}
                    {a.file_path ? (
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <a
                          href={`${API_URL}${a.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-700 hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          {a.file_path.split('/').pop()}
                        </a>
                        <label className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 ml-1">
                          (remplacer
                          <input
                            type="file"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleAttachFile(a, f) }}
                          />
                          )
                        </label>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-1.5 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                        <Paperclip className="w-3.5 h-3.5" />
                        Joindre un fichier
                        <input
                          type="file"
                          className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleAttachFile(a, f) }}
                        />
                      </label>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggle(a)}
                        className={a.is_active ? 'btn-secondary text-xs py-1.5 px-3' : 'btn-primary text-xs py-1.5 px-3'}
                      >
                        {a.is_active ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
