'use client'

import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DataTablePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  total: number
  perPage: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
}

export function DataTablePagination({
  page,
  totalPages,
  onPageChange,
  total,
  perPage,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
}: DataTablePaginationProps) {
  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  if (totalPages <= 1 && total === 0) return null

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
      {/* Page size selector */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Afficher</span>
          <select
            value={perPage}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>par page</span>
        </div>
      )}

      {/* Results info */}
      <p className="text-sm text-gray-500 order-2 sm:order-1">
        Affichage de <span className="font-medium">{start}</span> à{' '}
        <span className="font-medium">{end}</span> sur{' '}
        <span className="font-medium">{total}</span> résultats
      </p>

      {/* Pagination controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          title="Première page"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <ChevronLeft className="w-4 h-4 -ml-3" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          title="Page précédente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'w-9 h-9 rounded-lg text-sm font-medium transition-colors border',
              p === page
                ? 'bg-primary-700 text-white border-primary-700 shadow-sm'
                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          title="Page suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          title="Dernière page"
        >
          <ChevronRight className="w-4 h-4 -ml-3" />
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
