'use client'
import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, Trash2, Download, BookMarked } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatFileSize } from '@/lib/utils'
import api from '@/lib/api'
import type { CourseDocument, Module } from '@/types'

const DOC_TYPES = [
  { value: 'course', label: 'Cours' },
  { value: 'td', label: 'TD' },
  { value: 'tp', label: 'TP' },
  { value: 'exam', label: 'Examen' },
  { value: 'other', label: 'Autre' },
]

const typeColors: Record<string, string> = {
  course: 'bg-blue-100 text-blue-700 border-blue-200',
  td: 'bg-amber-100 text-amber-700 border-amber-200',
  tp: 'bg-green-100 text-green-700 border-green-200',
  exam: 'bg-red-100 text-red-700 border-red-200',
  other: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function TeacherDocumentsPage() {
  const [documents, setDocuments] = useState<CourseDocument[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState({ module_id: '', type: '' })
  const [form, setForm] = useState({ title: '', description: '', module_id: '', document_type: 'course' })
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchDocs = async () => {
    try {
      const params: Record<string, string> = {}
      if (filter.module_id) params.module_id = filter.module_id
      if (filter.type) params.document_type = filter.type
      const res = await api.get('/documents', { params })
      const data = res.data
      setDocuments(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [])
    } catch { toast.error('Erreur de chargement') }
  }

  useEffect(() => {
    Promise.all([fetchDocs(), api.get('/academic/my-modules')])
      .then(([_, modRes]) => setModules(modRes.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading) fetchDocs()
  }, [filter])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) { toast.error('Sélectionnez un fichier'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('document_type', form.document_type)
      if (form.module_id) fd.append('module_id', form.module_id)
      await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Document publié !')
      setShowForm(false)
      setForm({ title: '', description: '', module_id: '', document_type: 'course' })
      if (fileRef.current) fileRef.current.value = ''
      fetchDocs()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de l\'envoi')
    } finally { setUploading(false) }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return
    try {
      await api.delete(`/documents/${id}`)
      toast.success('Document supprimé')
      setDocuments(prev => prev.filter(d => d.id !== id))
    } catch { toast.error('Erreur lors de la suppression') }
  }

  const handleDownload = async (doc: CourseDocument) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.title
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Erreur de téléchargement') }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes documents</h1>
          <p className="text-gray-500 text-sm mt-0.5">{documents.length} document(s)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <Upload className="w-4 h-4" />Publier un document
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Nouveau document</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Titre</label>
              <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Module</label>
              <select className="form-input" value={form.module_id} onChange={e => setForm({...form, module_id: e.target.value})}>
                <option value="">Général (tous modules)</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Type</label>
              <select className="form-input" value={form.document_type} onChange={e => setForm({...form, document_type: e.target.value})}>
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Fichier (PDF, Word, max 20 Mo)</label>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls" className="form-input" required />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Description (optionnel)</label>
              <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brève description du contenu..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2">
              <Upload className="w-4 h-4" />{uploading ? 'Envoi...' : 'Publier'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select className="form-input w-auto text-sm" value={filter.module_id} onChange={e => setFilter({...filter, module_id: e.target.value})}>
          <option value="">Tous les modules</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="form-input w-auto text-sm" value={filter.type} onChange={e => setFilter({...filter, type: e.target.value})}>
          <option value="">Tous les types</option>
          {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {documents.length === 0 ? (
          <div className="py-16"><EmptyState icon={FileText} title="Aucun document publié" /></div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="table-header">Document</th>
                <th className="table-header">Module</th>
                <th className="table-header text-center">Type</th>
                <th className="table-header text-center">Taille</th>
                <th className="table-header">Date</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map(doc => {
                const mod = modules.find(m => m.id === doc.module_id)
                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <BookMarked className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{doc.title}</p>
                          {doc.description && <p className="text-xs text-gray-400 truncate max-w-xs">{doc.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-500">{mod?.name || '—'}</td>
                    <td className="table-cell text-center">
                      <span className={`badge ${typeColors[doc.document_type] || typeColors.other}`}>
                        {DOC_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                      </span>
                    </td>
                    <td className="table-cell text-center text-xs text-gray-400">{formatFileSize(doc.file_size)}</td>
                    <td className="table-cell text-xs text-gray-400">{formatDate(doc.created_at)}</td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleDownload(doc)} className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition-colors" title="Télécharger">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(doc.id, doc.title)} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
