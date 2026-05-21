import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const start = total === 0 ? 0 : (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
    if (totalPages <= 5) return index + 1
    if (page <= 3) return index + 1
    if (page >= totalPages - 2) return totalPages - 4 + index
    return page - 2 + index
  })

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <span>
          Affichage de <strong>{start}</strong> à <strong>{end}</strong> sur <strong>{total}</strong>
        </span>
        {onPageSizeChange && (
          <>
            <span className="text-gray-300">|</span>
            <select
              value={perPage}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-lg border border-primary-100 bg-white px-2 py-1 text-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}/page
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(
              'h-9 w-9 rounded-lg border text-sm font-medium transition-colors',
              p === page ? 'border-primary-700 bg-primary-700 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
