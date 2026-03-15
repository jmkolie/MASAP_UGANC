'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BookMarked, FileText, Download, File, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatFileSize } from '@/lib/utils'
import api from '@/lib/api'
import type { Module, CourseDocument } from '@/types'

const DOC_TYPE_LABELS: Record<string, string> = {
  course: 'Cours',
  td: 'TD',
  tp: 'TP',
  exam: 'Examen',
  other: 'Autre',
}

const DOC_TYPE_COLORS: Record<string, string> = {
  course: 'bg-blue-100 text-blue-700 border-blue-200',
  td: 'bg-amber-100 text-amber-700 border-amber-200',
  tp: 'bg-green-100 text-green-700 border-green-200',
  exam: 'bg-red-100 text-red-700 border-red-200',
  other: 'bg-gray-100 text-gray-600 border-gray-200',
}

function FileIcon({ type }: { type: string }) {
  if (type?.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />
  if (type?.includes('sheet') || type?.includes('excel')) return <FileSpreadsheet className="w-8 h-8 text-green-600" />
  return <File className="w-8 h-8 text-blue-500" />
}

export default function ModuleDocumentsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [module, setModule] = useState<Module | null>(null)
  const [documents, setDocuments] = useState<CourseDocument[]>([])
  const [activeType, setActiveType] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      api.get(`/academic/modules/${id}`),
      api.get('/documents', { params: { module_id: id, per_page: 100 } }),
    ])
      .then(([modRes, docRes]) => {
        setModule(modRes.data)
        setDocuments(docRes.data.items || [])
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [id])

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

  const types = [...new Set(documents.map(d => d.document_type))]
  const filtered = activeType ? documents.filter(d => d.document_type === activeType) : documents

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
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

      {/* Module info */}
      {module?.description && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          {module.description}
        </div>
      )}

      {/* Type filter tabs */}
      {types.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveType('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!activeType ? 'bg-primary-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Tous ({documents.length})
          </button>
          {types.map(t => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeType === t ? 'bg-primary-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {DOC_TYPE_LABELS[t] || t} ({documents.filter(d => d.document_type === t).length})
            </button>
          ))}
        </div>
      )}

      {/* Documents grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card py-16">
          <EmptyState
            icon={FileText}
            title="Aucun document disponible"
            description="L'enseignant n'a pas encore publié de supports pour ce module."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 hover:shadow-card-hover transition-shadow flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <FileIcon type={doc.file_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{doc.title}</p>
                  {doc.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{doc.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`badge text-xs ${DOC_TYPE_COLORS[doc.document_type] || DOC_TYPE_COLORS.other}`}>
                  {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                </span>
                {doc.file_size && (
                  <span className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</span>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">{formatDate(doc.created_at)}</span>
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloading === doc.id}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800 disabled:opacity-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloading === doc.id ? 'Téléchargement...' : 'Télécharger'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
