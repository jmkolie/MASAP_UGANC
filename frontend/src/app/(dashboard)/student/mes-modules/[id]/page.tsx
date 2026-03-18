'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, FileText, Download, File, FileSpreadsheet,
  ClipboardList, CheckCircle, Clock, Star, Upload, ChevronDown, ChevronUp, Paperclip,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { formatDate, formatFileSize } from '@/lib/utils'
import api from '@/lib/api'
import type { Module, CourseDocument } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const DOC_TYPE_LABELS: Record<string, string> = {
  course: 'Cours', td: 'TD', tp: 'TP', exam: 'Examen', other: 'Autre',
}
const DOC_TYPE_COLORS: Record<string, string> = {
  course: 'bg-blue-100 text-blue-700 border-blue-200',
  td: 'bg-amber-100 text-amber-700 border-amber-200',
  tp: 'bg-green-100 text-green-700 border-green-200',
  exam: 'bg-red-100 text-red-700 border-red-200',
  other: 'bg-gray-100 text-gray-600 border-gray-200',
}

function FileIcon({ type }: { type: string | undefined }) {
  if (type?.includes('pdf')) return <FileText className="w-7 h-7 text-red-500" />
  if (type?.includes('sheet') || type?.includes('excel')) return <FileSpreadsheet className="w-7 h-7 text-green-600" />
  return <File className="w-7 h-7 text-blue-500" />
}

interface Submission {
  id: number
  file_path?: string | null
  submitted_at: string
  score: number | null
  feedback: string | null
  graded_at: string | null
}

interface Assignment {
  id: number
  title: string
  description: string
  module_id: number
  due_date: string
  max_score: number
  file_path?: string | null
  accepted_file_types?: string | null
  submission: Submission | null
}

export default function ModuleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [module, setModule] = useState<Module | null>(null)
  const [documents, setDocuments] = useState<CourseDocument[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [activeDocType, setActiveDocType] = useState('')
  const [expandedAssignment, setExpandedAssignment] = useState<number | null>(null)
  const [uploading, setUploading] = useState<number | null>(null)
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const fetchData = async () => {
    try {
      const [modRes, docRes, assignRes] = await Promise.all([
        api.get(`/academic/modules/${id}`),
        api.get('/documents', { params: { module_id: id, per_page: 100 } }),
        api.get('/grades/assignments/student'),
      ])
      setModule(modRes.data)
      setDocuments(docRes.data.items || [])
      const all: Assignment[] = assignRes.data || []
      setAssignments(all.filter(a => a.module_id === parseInt(id)))
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleDownload = async (doc: CourseDocument) => {
    setDownloading(doc.id)
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = doc.title
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Erreur lors du téléchargement')
    } finally {
      setDownloading(null)
    }
  }

  const handleSubmit = async (assignmentId: number, file: File) => {
    setUploading(assignmentId)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/grades/assignments/${assignmentId}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Devoir soumis !')
      fetchData()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la soumission')
    } finally {
      setUploading(null)
      if (fileRefs.current[assignmentId]) fileRefs.current[assignmentId]!.value = ''
    }
  }

  const docTypes = Array.from(new Set(documents.map(d => d.document_type)))
  const filteredDocs = activeDocType ? documents.filter(d => d.document_type === activeDocType) : documents

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
          <p className="text-gray-500 text-sm mt-0.5 font-mono">{module?.code} · {module?.credits} crédits ECTS</p>
        </div>
      </div>

      {module?.description && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          {module.description}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* ── Bloc Ressources ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 pb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Ressources</h2>
              <p className="text-xs text-gray-400">{documents.length} support(s)</p>
            </div>
          </div>

          {docTypes.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setActiveDocType('')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${!activeDocType ? 'bg-primary-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                Tous ({documents.length})
              </button>
              {docTypes.map(t => (
                <button key={t} onClick={() => setActiveDocType(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${activeDocType === t ? 'bg-primary-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {DOC_TYPE_LABELS[t] || t} ({documents.filter(d => d.document_type === t).length})
                </button>
              ))}
            </div>
          )}

          {filteredDocs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucun support disponible</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="bg-white rounded-xl border border-gray-100 shadow-card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileIcon type={doc.file_type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`badge text-xs ${DOC_TYPE_COLORS[doc.document_type] || DOC_TYPE_COLORS.other}`}>
                        {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </span>
                      {doc.file_size && <span className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</span>}
                      <span className="text-xs text-gray-400">{formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDownload(doc)} disabled={downloading === doc.id}
                    className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800 disabled:opacity-50 transition-colors">
                    <Download className="w-4 h-4" />
                    {downloading === doc.id ? '...' : 'Télécharger'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Bloc Évaluations ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 pb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Évaluations</h2>
              <p className="text-xs text-gray-400">{assignments.length} devoir(s)</p>
            </div>
          </div>

          {assignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucun devoir pour ce module</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map(a => {
                const sub = a.submission
                const isPast = new Date(a.due_date) < new Date()
                const isExpanded = expandedAssignment === a.id
                const isUploading = uploading === a.id

                const badge = sub
                  ? sub.score !== null
                    ? <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><Star className="w-3 h-3" />{sub.score}/{a.max_score}</span>
                    : <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" />Soumis</span>
                  : isPast
                    ? <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">En retard</span>
                    : <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />À rendre</span>

                return (
                  <div key={a.id} className={`bg-white rounded-xl border shadow-card overflow-hidden ${sub ? 'border-gray-100' : isPast ? 'border-red-100' : 'border-amber-100'}`}>
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedAssignment(isExpanded ? null : a.id)}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sub ? 'bg-green-100' : 'bg-amber-100'}`}>
                          {sub ? <CheckCircle className="w-4 h-4 text-green-700" /> : <ClipboardList className="w-4 h-4 text-amber-700" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                          <p className="text-xs text-gray-400">Limite : {formatDate(a.due_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {badge}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-50 px-4 py-4 bg-gray-50/50 space-y-3">
                        {a.description && <p className="text-sm text-gray-600">{a.description}</p>}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          <span>Note max : {a.max_score} pts</span>
                          {a.accepted_file_types && (
                            <span>Formats : <strong className="text-gray-600">{a.accepted_file_types.toUpperCase()}</strong></span>
                          )}
                        </div>

                        {a.file_path && (
                          <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-100">
                            <Paperclip className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <a href={`${API_URL}${a.file_path}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary-700 hover:underline">
                              <Download className="w-3 h-3" />{a.file_path.split('/').pop()}
                            </a>
                          </div>
                        )}

                        {sub ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-lg border border-green-100">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-green-700">Soumis le {formatDate(sub.submitted_at)}</p>
                                {sub.file_path && (
                                  <a href={`${API_URL}${sub.file_path}`} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                                    <Download className="w-3 h-3" />{sub.file_path.split('/').pop()}
                                  </a>
                                )}
                              </div>
                            </div>
                            {sub.score !== null ? (
                              <div className="p-2.5 bg-white rounded-lg border border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-500">Note :</span>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-primary-700">{sub.score} / {a.max_score}</span>
                                  {sub.feedback && <p className="text-xs text-gray-400 italic mt-0.5">"{sub.feedback}"</p>}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">En attente de correction.</p>
                            )}
                            {sub.score === null && (
                              <label className={`flex items-center gap-2 cursor-pointer w-fit px-3 py-1.5 text-xs border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload className="w-3.5 h-3.5" />
                                {isUploading ? 'Envoi...' : 'Remplacer ma soumission'}
                                <input type="file" className="hidden" ref={el => { fileRefs.current[a.id] = el }}
                                  onChange={e => { const f = e.target.files?.[0]; if (f) handleSubmit(a.id, f) }} />
                              </label>
                            )}
                          </div>
                        ) : (
                          <div>
                            {isPast && <p className="text-xs text-red-500 mb-2">Date limite dépassée — vous pouvez quand même soumettre.</p>}
                            <label className={`flex items-center gap-2 cursor-pointer w-fit px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm rounded-lg transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                              <Upload className="w-4 h-4" />
                              {isUploading ? 'Envoi en cours...' : 'Soumettre mon travail'}
                              <input type="file" className="hidden" ref={el => { fileRefs.current[a.id] = el }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleSubmit(a.id, f) }} />
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
