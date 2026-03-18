'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, FileText, ClipboardList, Upload, Plus, Trash2, Download,
  Paperclip, X, Pencil, Users, Star, ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { formatDate, formatFileSize } from '@/lib/utils'
import api from '@/lib/api'
import type { Module, CourseDocument } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
const FILE_TYPE_OPTIONS = [
  { value: '', label: 'Tous types acceptés' },
  { value: 'pdf', label: 'PDF uniquement' },
  { value: 'pdf,docx', label: 'PDF ou Word (.docx)' },
  { value: 'pdf,docx,doc', label: 'PDF ou Word (.doc/.docx)' },
  { value: 'zip,rar', label: 'Archive (zip/rar)' },
  { value: 'pdf,zip', label: 'PDF ou Archive' },
  { value: 'jpg,jpeg,png', label: 'Image (jpg/png)' },
]

interface Assignment {
  id: number
  title: string
  description: string
  due_date: string
  max_score: number
  file_path?: string | null
  accepted_file_types?: string | null
  is_active: boolean
  submission_count?: number
}

interface Submission {
  id: number
  student_name: string
  student_matricule: string
  file_path?: string | null
  submitted_at: string
  score: number | null
  feedback: string | null
  graded_at: string | null
}

const emptyAssignForm = { title: '', description: '', due_date: '', max_score: '20', accepted_file_types: '' }

export default function TeacherModuleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ressources' | 'evaluations'>('ressources')

  // ── Documents state ──
  const [documents, setDocuments] = useState<CourseDocument[]>([])
  const [showDocForm, setShowDocForm] = useState(false)
  const [docForm, setDocForm] = useState({ title: '', description: '', document_type: 'course' })
  const [uploading, setUploading] = useState(false)
  const docFileRef = useRef<HTMLInputElement>(null)

  // ── Assignments state ──
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assignForm, setAssignForm] = useState(emptyAssignForm)
  const [assignFile, setAssignFile] = useState<File | null>(null)
  const assignFileRef = useRef<HTMLInputElement>(null)
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const [expandedAssign, setExpandedAssign] = useState<number | null>(null)

  // ── Edit assignment ──
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState(emptyAssignForm)
  const [editSubmitting, setEditSubmitting] = useState(false)

  // ── Submissions panel ──
  const [submissionsPanel, setSubmissionsPanel] = useState<number | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [gradingId, setGradingId] = useState<number | null>(null)
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' })
  const [gradeSubmitting, setGradeSubmitting] = useState(false)

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents', { params: { module_id: id, per_page: 100 } })
      setDocuments(res.data?.items || [])
    } catch {}
  }

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/grades/assignments', { params: { module_id: id } })
      setAssignments((res.data || []).filter((a: Assignment & { module_id: number }) => a.module_id === parseInt(id)))
    } catch {}
  }

  useEffect(() => {
    Promise.all([
      api.get(`/academic/modules/${id}`),
      fetchDocuments(),
      fetchAssignments(),
    ])
      .then(([modRes]) => setModule(modRes.data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [id])

  // ── Document handlers ──
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = docFileRef.current?.files?.[0]
    if (!file) { toast.error('Sélectionnez un fichier'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', docForm.title)
      fd.append('description', docForm.description)
      fd.append('document_type', docForm.document_type)
      fd.append('module_id', id)
      await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Document publié !')
      setShowDocForm(false)
      setDocForm({ title: '', description: '', document_type: 'course' })
      if (docFileRef.current) docFileRef.current.value = ''
      fetchDocuments()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Erreur lors de l'envoi")
    } finally { setUploading(false) }
  }

  const handleDeleteDoc = async (doc: CourseDocument) => {
    if (!confirm(`Supprimer "${doc.title}" ?`)) return
    try {
      await api.delete(`/documents/${doc.id}`)
      toast.success('Document supprimé')
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    } catch { toast.error('Erreur') }
  }

  const handleDownloadDoc = async (doc: CourseDocument) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = doc.title; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Erreur de téléchargement') }
  }

  // ── Assignment handlers ──
  const handleCreateAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    setAssignSubmitting(true)
    try {
      const res = await api.post('/grades/assignments', {
        title: assignForm.title,
        description: assignForm.description,
        module_id: parseInt(id),
        due_date: assignForm.due_date,
        max_score: parseFloat(assignForm.max_score),
        accepted_file_types: assignForm.accepted_file_types || null,
        is_active: true,
      })
      if (assignFile && res.data.id) {
        const fd = new FormData()
        fd.append('file', assignFile)
        await api.post(`/grades/assignments/${res.data.id}/file`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      toast.success('Devoir créé !')
      setShowAssignForm(false)
      setAssignForm(emptyAssignForm)
      setAssignFile(null)
      fetchAssignments()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur')
    } finally { setAssignSubmitting(false) }
  }

  const openEdit = (a: Assignment) => {
    setEditId(a.id)
    setEditForm({
      title: a.title,
      description: a.description || '',
      due_date: a.due_date ? a.due_date.slice(0, 16) : '',
      max_score: String(a.max_score),
      accepted_file_types: a.accepted_file_types || '',
    })
  }

  const handleEditAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editId) return
    setEditSubmitting(true)
    try {
      await api.put(`/grades/assignments/${editId}`, {
        title: editForm.title,
        description: editForm.description,
        due_date: editForm.due_date || null,
        max_score: parseFloat(editForm.max_score),
        accepted_file_types: editForm.accepted_file_types || null,
      })
      toast.success('Devoir modifié !')
      setEditId(null)
      fetchAssignments()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur')
    } finally { setEditSubmitting(false) }
  }

  const handleToggleAssign = async (a: Assignment) => {
    try {
      await api.put(`/grades/assignments/${a.id}`, { is_active: !a.is_active })
      toast.success(a.is_active ? 'Désactivé' : 'Réactivé')
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
      toast.error(err?.response?.data?.detail || 'Erreur')
    }
  }

  const loadSubmissions = async (assignmentId: number) => {
    setSubmissionsPanel(assignmentId)
    setSubsLoading(true)
    setSubmissions([])
    try {
      const res = await api.get(`/grades/assignments/${assignmentId}/submissions`)
      setSubmissions(res.data || [])
    } catch { toast.error('Erreur chargement rendus') }
    finally { setSubsLoading(false) }
  }

  const handleGrade = async (sub: Submission) => {
    setGradeSubmitting(true)
    try {
      await api.put(`/grades/submissions/${sub.id}/grade`, {
        score: gradeForm.score !== '' ? parseFloat(gradeForm.score) : undefined,
        feedback: gradeForm.feedback || undefined,
      })
      toast.success('Note enregistrée !')
      setGradingId(null)
      setGradeForm({ score: '', feedback: '' })
      if (submissionsPanel) loadSubmissions(submissionsPanel)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur')
    } finally { setGradeSubmitting(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{module?.name || 'Module'}</h1>
          <p className="text-gray-500 text-sm mt-0.5 font-mono">{module?.code} · {module?.credits} crédits</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('ressources')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ressources' ? 'border-primary-700 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FileText className="w-4 h-4" />Ressources
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'ressources' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>{documents.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('evaluations')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'evaluations' ? 'border-primary-700 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <ClipboardList className="w-4 h-4" />Évaluations
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'evaluations' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>{assignments.length}</span>
        </button>
      </div>

      {/* ── Onglet Ressources ── */}
      {activeTab === 'ressources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{documents.length} document(s) publié(s)</p>
            <button
              onClick={() => setShowDocForm(!showDocForm)}
              className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Upload className="w-4 h-4" />Publier un document
            </button>
          </div>

          {showDocForm && (
            <form onSubmit={handleUploadDoc} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Titre</label>
                  <input className="form-input" value={docForm.title} onChange={e => setDocForm({...docForm, title: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={docForm.document_type} onChange={e => setDocForm({...docForm, document_type: e.target.value})}>
                    {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Fichier</label>
                  <input ref={docFileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls" className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Description (optionnel)</label>
                  <input className="form-input" value={docForm.description} onChange={e => setDocForm({...docForm, description: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2">
                  <Upload className="w-4 h-4" />{uploading ? 'Envoi...' : 'Publier'}
                </button>
                <button type="button" onClick={() => setShowDocForm(false)} className="btn-secondary">Annuler</button>
              </div>
            </form>
          )}

          {documents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Aucun document publié pour ce module</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="table-header">Document</th>
                    <th className="table-header text-center">Type</th>
                    <th className="table-header text-center">Taille</th>
                    <th className="table-header">Date</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <p className="font-medium text-gray-800 text-sm">{doc.title}</p>
                        {doc.description && <p className="text-xs text-gray-400 truncate max-w-xs">{doc.description}</p>}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`badge ${typeColors[doc.document_type] || typeColors.other}`}>
                          {DOC_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                        </span>
                      </td>
                      <td className="table-cell text-center text-xs text-gray-400">{formatFileSize(doc.file_size)}</td>
                      <td className="table-cell text-xs text-gray-400">{formatDate(doc.created_at)}</td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleDownloadDoc(doc)} className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteDoc(doc)} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Évaluations ── */}
      {activeTab === 'evaluations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{assignments.length} devoir(s)</p>
            <button
              onClick={() => setShowAssignForm(!showAssignForm)}
              className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />Nouveau devoir
            </button>
          </div>

          {showAssignForm && (
            <form onSubmit={handleCreateAssign} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="form-label">Titre</label>
                  <input className="form-input" value={assignForm.title} onChange={e => setAssignForm({...assignForm, title: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">Date limite</label>
                  <input type="datetime-local" className="form-input" value={assignForm.due_date} onChange={e => setAssignForm({...assignForm, due_date: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">Note maximale</label>
                  <input type="number" min="1" max="100" step="0.5" className="form-input" value={assignForm.max_score} onChange={e => setAssignForm({...assignForm, max_score: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Types de fichiers acceptés</label>
                  <select className="form-input" value={assignForm.accepted_file_types} onChange={e => setAssignForm({...assignForm, accepted_file_types: e.target.value})}>
                    {FILE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Fichier joint (optionnel)</label>
                  <div className="flex items-center gap-2">
                    <input ref={assignFileRef} type="file" className="hidden" onChange={e => setAssignFile(e.target.files?.[0] || null)} />
                    <button type="button" onClick={() => assignFileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                      <Paperclip className="w-4 h-4" />{assignFile ? assignFile.name : 'Joindre'}
                    </button>
                    {assignFile && (
                      <button type="button" onClick={() => { setAssignFile(null); if (assignFileRef.current) assignFileRef.current.value = '' }} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Consignes</label>
                  <textarea className="form-input" rows={3} value={assignForm.description} onChange={e => setAssignForm({...assignForm, description: e.target.value})} placeholder="Consignes détaillées..." />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={assignSubmitting} className="btn-primary">{assignSubmitting ? 'Création...' : 'Créer'}</button>
                <button type="button" onClick={() => setShowAssignForm(false)} className="btn-secondary">Annuler</button>
              </div>
            </form>
          )}

          {/* Edit modal */}
          {editId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <form onSubmit={handleEditAssign} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Modifier le devoir</h3>
                  <button type="button" onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="form-label">Titre</label>
                    <input className="form-input" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label">Date limite</label>
                    <input type="datetime-local" className="form-input" value={editForm.due_date} onChange={e => setEditForm({...editForm, due_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Note maximale</label>
                    <input type="number" min="1" max="100" step="0.5" className="form-input" value={editForm.max_score} onChange={e => setEditForm({...editForm, max_score: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">Types de fichiers acceptés</label>
                    <select className="form-input" value={editForm.accepted_file_types} onChange={e => setEditForm({...editForm, accepted_file_types: e.target.value})}>
                      {FILE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">Consignes</label>
                    <textarea className="form-input" rows={3} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={editSubmitting} className="btn-primary">{editSubmitting ? 'Enregistrement...' : 'Enregistrer'}</button>
                  <button type="button" onClick={() => setEditId(null)} className="btn-secondary">Annuler</button>
                </div>
              </form>
            </div>
          )}

          {/* Submissions panel */}
          {submissionsPanel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">
                    Rendus — {assignments.find(a => a.id === submissionsPanel)?.title}
                  </h3>
                  <button onClick={() => { setSubmissionsPanel(null); setGradingId(null) }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                  {subsLoading ? (
                    <p className="text-sm text-gray-500 text-center py-8">Chargement...</p>
                  ) : submissions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Aucun rendu pour l'instant.</p>
                  ) : submissions.map(sub => (
                    <div key={sub.id} className="border border-gray-100 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{sub.student_name}</p>
                          <p className="text-xs text-gray-400">{sub.student_matricule} · {formatDate(sub.submitted_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {sub.score !== null
                            ? <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">{sub.score}/{assignments.find(a => a.id === submissionsPanel)?.max_score}</span>
                            : <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Non noté</span>
                          }
                          {sub.file_path && (
                            <a href={`${API_URL}${sub.file_path}`} target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:text-primary-900">
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => { setGradingId(sub.id); setGradeForm({ score: sub.score !== null ? String(sub.score) : '', feedback: sub.feedback || '' }) }}
                            className="text-xs px-2 py-1 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                          >
                            <Star className="w-3 h-3" />Noter
                          </button>
                        </div>
                      </div>
                      {gradingId === sub.id && (
                        <div className="pt-2 border-t border-gray-50 space-y-2">
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <label className="form-label text-xs">Note</label>
                              <input type="number" min="0" step="0.5" max={assignments.find(a => a.id === submissionsPanel)?.max_score}
                                className="form-input text-sm" value={gradeForm.score}
                                onChange={e => setGradeForm({...gradeForm, score: e.target.value})}
                                placeholder={`/ ${assignments.find(a => a.id === submissionsPanel)?.max_score}`} />
                            </div>
                            <div className="flex-[2]">
                              <label className="form-label text-xs">Commentaire</label>
                              <input className="form-input text-sm" value={gradeForm.feedback}
                                onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})} placeholder="Commentaire..." />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleGrade(sub)} disabled={gradeSubmitting || gradeForm.score === ''} className="btn-primary text-xs py-1.5 px-3">
                              {gradeSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                            <button onClick={() => setGradingId(null)} className="btn-secondary text-xs py-1.5 px-3">Annuler</button>
                          </div>
                        </div>
                      )}
                      {sub.feedback && gradingId !== sub.id && (
                        <p className="text-xs text-gray-500 italic">"{sub.feedback}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {assignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Aucun devoir créé pour ce module</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map(a => {
                const isPast = new Date(a.due_date) < new Date()
                const isExpanded = expandedAssign === a.id
                return (
                  <div key={a.id} className={`bg-white rounded-xl border shadow-card overflow-hidden ${a.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setExpandedAssign(isExpanded ? null : a.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <ClipboardList className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                          <p className="text-xs text-gray-400">Limite : {formatDate(a.due_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {a.file_path && <Paperclip className="w-3.5 h-3.5 text-gray-400" />}
                        <span className={`badge ${isPast ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                          {isPast ? 'Expiré' : 'En cours'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Users className="w-3.5 h-3.5" />{a.submission_count ?? 0}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-gray-50 px-4 py-3 bg-gray-50/50 space-y-3">
                        {a.description && <p className="text-sm text-gray-600">{a.description}</p>}
                        <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                          <span>Note max : {a.max_score} pts</span>
                          {a.accepted_file_types && <span>Formats : {a.accepted_file_types.toUpperCase()}</span>}
                        </div>
                        {a.file_path ? (
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                            <a href={`${API_URL}${a.file_path}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-700 hover:underline flex items-center gap-1">
                              <Download className="w-3 h-3" />{a.file_path.split('/').pop()}
                            </a>
                            <label className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 ml-1">
                              (remplacer<input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleAttachFile(a, f) }} />)
                            </label>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-1.5 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100">
                            <Paperclip className="w-3.5 h-3.5" />Joindre un fichier
                            <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleAttachFile(a, f) }} />
                          </label>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => openEdit(a)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                            <Pencil className="w-3.5 h-3.5" />Modifier
                          </button>
                          <button onClick={() => loadSubmissions(a.id)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />Rendus ({a.submission_count ?? 0})
                          </button>
                          <button onClick={() => handleToggleAssign(a)} className={`text-xs py-1.5 px-3 ${a.is_active ? 'btn-secondary' : 'btn-primary'}`}>
                            {a.is_active ? 'Désactiver' : 'Réactiver'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
