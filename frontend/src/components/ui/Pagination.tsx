import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  total: number
  perPage: number
}

export function Pagination({ page, totalPages, onPageChange, total, perPage }: PaginationProps) {
  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  if (totalPages <= 1) return null

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-500">
        Affichage de <span className="font-medium">{start}</span> à{' '}
        <span className="font-medium">{end}</span> sur{' '}
        <span className="font-medium">{total}</span> résultats
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
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
                ? 'bg-primary-700 text-white border-primary-700'
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
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
