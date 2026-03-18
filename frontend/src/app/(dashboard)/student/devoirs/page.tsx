'use client'
import { useState, useEffect, useRef } from 'react'
import { ClipboardList, ChevronDown, ChevronUp, Paperclip, Download, Upload, CheckCircle, Clock, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
  module_name: string | null
  due_date: string
  max_score: number
  file_path?: string | null
  accepted_file_types?: string | null
  is_active: boolean
  created_at: string
  submission: Submission | null
}

export default function StudentDevoirsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [uploading, setUploading] = useState<number | null>(null)
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/grades/assignments/student')
      setAssignments(res.data || [])
    } catch { /* no assignments */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAssignments() }, [])

  const handleSubmit = async (assignmentId: number, file: File) => {
    setUploading(assignmentId)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/grades/assignments/${assignmentId}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Devoir soumis avec succès !')
      fetchAssignments()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la soumission')
    } finally {
      setUploading(null)
      if (fileRefs.current[assignmentId]) fileRefs.current[assignmentId]!.value = ''
    }
  }

  const pending = assignments.filter(a => !a.submission)
  const submitted = assignments.filter(a => !!a.submission)

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes Devoirs</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {pending.length} à rendre · {submitted.length} soumis
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card py-16">
          <EmptyState icon={ClipboardList} title="Aucun devoir pour le moment" description="Les devoirs publiés par vos enseignants apparaîtront ici." />
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">À rendre</h2>
              <div className="space-y-3">
                {pending.map(a => <AssignmentCard key={a.id} a={a} expanded={expanded} setExpanded={setExpanded} uploading={uploading} handleSubmit={handleSubmit} fileRefs={fileRefs} />)}
              </div>
            </section>
          )}

          {/* Submitted */}
          {submitted.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Soumis</h2>
              <div className="space-y-3">
                {submitted.map(a => <AssignmentCard key={a.id} a={a} expanded={expanded} setExpanded={setExpanded} uploading={uploading} handleSubmit={handleSubmit} fileRefs={fileRefs} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function AssignmentCard({
  a,
  expanded,
  setExpanded,
  uploading,
  handleSubmit,
  fileRefs,
}: {
  a: Assignment
  expanded: number | null
  setExpanded: (id: number | null) => void
  uploading: number | null
  handleSubmit: (id: number, file: File) => void
  fileRefs: React.MutableRefObject<Record<number, HTMLInputElement | null>>
}) {
  const isExpanded = expanded === a.id
  const isPast = new Date(a.due_date) < new Date()
  const sub = a.submission
  const isUploading = uploading === a.id

  const statusBadge = sub
    ? sub.score !== null
      ? <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><Star className="w-3 h-3" />{sub.score}/{a.max_score}</span>
      : <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" />Soumis</span>
    : isPast
      ? <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">En retard</span>
      : <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />À rendre</span>

  return (
    <div className={`bg-white rounded-xl border shadow-card overflow-hidden ${sub ? 'border-gray-100' : isPast ? 'border-red-100' : 'border-amber-100'}`}>
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(isExpanded ? null : a.id)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${sub ? 'bg-green-100' : 'bg-amber-100'}`}>
            {sub
              ? <CheckCircle className="w-4 h-4 text-green-700" />
              : <ClipboardList className="w-4 h-4 text-amber-700" />
            }
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
            <p className="text-xs text-gray-400">
              {a.module_name || '—'} · Limite : {formatDate(a.due_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {statusBadge}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-50 px-4 py-4 bg-gray-50/50 space-y-4">
          {/* Description */}
          {a.description && <p className="text-sm text-gray-600">{a.description}</p>}

          {/* Info row */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-400">
            <span>Note max : {a.max_score} pts</span>
            {a.accepted_file_types && (
              <span>Formats acceptés : <strong className="text-gray-600">{a.accepted_file_types.toUpperCase()}</strong></span>
            )}
          </div>

          {/* Teacher file attachment */}
          {a.file_path && (
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
              <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 flex-1">Fichier du devoir :</span>
              <a
                href={`${API_URL}${a.file_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary-700 hover:underline font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                {a.file_path.split('/').pop()}
              </a>
            </div>
          )}

          {/* Submission section */}
          {sub ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-green-700">Devoir soumis le {formatDate(sub.submitted_at)}</p>
                  {sub.file_path && (
                    <a href={`${API_URL}${sub.file_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:underline mt-0.5">
                      <Download className="w-3 h-3" />{sub.file_path.split('/').pop()}
                    </a>
                  )}
                </div>
              </div>

              {/* Grade */}
              {sub.score !== null ? (
                <div className="p-3 bg-white rounded-lg border border-gray-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">Note obtenue</p>
                    <span className="text-sm font-bold text-primary-700">{sub.score} / {a.max_score}</span>
                  </div>
                  {sub.feedback && <p className="text-xs text-gray-500 italic">"{sub.feedback}"</p>}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">En attente de correction par l'enseignant.</p>
              )}

              {/* Re-submit if not yet graded */}
              {sub.score === null && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Soumettre une nouvelle version :</p>
                  <label className={`flex items-center gap-2 cursor-pointer w-fit px-3 py-2 text-xs border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload className="w-3.5 h-3.5" />
                    {isUploading ? 'Envoi en cours...' : 'Remplacer ma soumission'}
                    <input
                      type="file"
                      className="hidden"
                      ref={el => { fileRefs.current[a.id] = el }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleSubmit(a.id, f) }}
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div>
              {isPast && (
                <p className="text-xs text-red-500 mb-2">La date limite est dépassée. Vous pouvez quand même soumettre votre travail.</p>
              )}
              <label className={`flex items-center gap-2 cursor-pointer w-fit px-4 py-2.5 bg-primary-700 hover:bg-primary-800 text-white text-sm rounded-lg transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="w-4 h-4" />
                {isUploading ? 'Envoi en cours...' : 'Soumettre mon travail'}
                <input
                  type="file"
                  className="hidden"
                  ref={el => { fileRefs.current[a.id] = el }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleSubmit(a.id, f) }}
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
