'use client'
import { useState, useEffect } from 'react'
import { BookMarked, Users, FileText } from 'lucide-react'
import Link from 'next/link'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import api from '@/lib/api'
import type { Module } from '@/types'

export default function MesModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/academic/my-modules')
      .then(res => setModules(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes modules</h1>
        <p className="text-gray-500 text-sm mt-1">{modules.length} module(s) assigné(s)</p>
      </div>

      {modules.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card py-16">
          <EmptyState
            icon={BookMarked}
            title="Aucun module assigné"
            description="Contactez le chef de département pour l'affectation de modules."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <BookMarked className="w-5 h-5 text-primary-700" />
                </div>
                <span className={`badge ${m.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {m.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{m.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{m.code}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                <span>{m.credits} crédits</span>
                <span>•</span>
                <span>Coeff. {m.coefficient}</span>
              </div>
              {m.description && (
                <p className="text-xs text-gray-400 mb-4 line-clamp-2">{m.description}</p>
              )}
              <div className="flex gap-2">
                <Link
                  href="/teacher/saisie-notes"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Notes
                </Link>
                <Link
                  href="/teacher/mes-etudiants"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  Étudiants
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
