'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookMarked, ChevronRight } from 'lucide-react'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import api from '@/lib/api'
import type { Module } from '@/types'

export default function MesModulesStudentPage() {
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/academic/my-enrolled-modules')
      .then(res => setModules(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes modules</h1>
        <p className="text-gray-500 text-sm mt-1">{modules.length} module(s) inscrit(s)</p>
      </div>

      {modules.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card py-16">
          <EmptyState
            icon={BookMarked}
            title="Aucun module trouvé"
            description="Vous n'êtes inscrit à aucun module pour le moment."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => router.push(`/student/mes-modules/${m.id}`)}
              className="bg-white rounded-xl border border-gray-100 shadow-card hover:shadow-card-hover hover:border-primary-200 transition-all p-5 text-left w-full"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookMarked className="w-5 h-5 text-blue-700" />
                </div>
                <span className={`badge ${m.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {m.is_active ? 'En cours' : 'Terminé'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{m.name}</h3>
              <p className="text-xs text-gray-500 mb-3 font-mono">{m.code}</p>
              {m.description && (
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{m.description}</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-medium">{m.credits} crédits ECTS</span>
                  <span>•</span>
                  <span>Coefficient {m.coefficient}</span>
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-primary-600">
                  Supports <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
