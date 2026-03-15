'use client'
import { useState, useEffect } from 'react'
import { FileText, Download, Search, Filter } from 'lucide-react'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate, formatFileSize } from '@/lib/utils'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import type { CourseDocument } from '@/types'

const DOC_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'course', label: 'Cours' },
  { value: 'td', label: 'TD' },
  { value: 'tp', label: 'TP' },
  { value: 'exam', label: 'Examens' },
  { value: 'other', label: 'Autres' },
]

const TYPE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.ms-powerpoint': '📊',
  'application/zip': '🗜️',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<CourseDocument[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [docType, setDocType] = useState('')

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, per_page: 15 }
      if (docType) params.document_type = docType
      const res = await api.get('/documents', { params })
      setDocs(res.data.items || [])
      setTotal(res.data.total || 0)
      setPages(res.data.pages || 1)
    } catch { } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [page, docType])

  const handleDownload = async (doc: CourseDocument) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: doc.file_type || 'application/octet-stream' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = doc.title
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      toast.error('Erreur lors du téléchargement')
    }
  }

  const filteredDocs = search
    ? docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()))
    : docs

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents de cours</h1>
        <p className="text-gray-500 text-sm mt-1">{total} document(s) disponible(s)</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={docType}
            onChange={(e) => { setDocType(e.target.value); setPage(1) }}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            {DOC_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents grid */}
      {loading ? (
        <PageLoader />
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card py-16">
          <EmptyState
            icon={FileText}
            title="Aucun document disponible"
            description="Les documents de cours seront disponibles ici."
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
                    {TYPE_ICONS[doc.file_type || ''] || '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                    {doc.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{doc.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge bg-blue-50 text-blue-700 border-blue-200">
                        {doc.document_type === 'course' ? 'Cours' :
                         doc.document_type === 'td' ? 'TD' :
                         doc.document_type === 'tp' ? 'TP' :
                         doc.document_type === 'exam' ? 'Examen' : 'Autre'}
                      </span>
                      {doc.file_size && (
                        <span className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(doc.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger
                </button>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={pages} onPageChange={setPage} total={total} perPage={15} />
        </>
      )}
    </div>
  )
}
