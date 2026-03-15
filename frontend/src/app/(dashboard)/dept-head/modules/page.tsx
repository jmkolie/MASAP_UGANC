'use client'
import { useState, useEffect } from 'react'
import { BookMarked, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import api from '@/lib/api'
import type { Module, Program } from '@/types'

interface TeachingAssignment {
  id: number
  module_id: number
  teacher_id: number
  teacher?: { first_name: string; last_name: string }
  role?: string
}

export default function DeptHeadModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProgram, setFilterProgram] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/academic/modules'),
      api.get('/academic/programs'),
    ])
      .then(([modRes, progRes]) => {
        setModules(modRes.data || [])
        setPrograms(progRes.data || [])
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = modules.filter(m =>
    !filterProgram || String(m.program_id) === filterProgram
  )

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modules</h1>
          <p className="text-gray-500 text-sm mt-0.5">{modules.length} module(s) au total</p>
        </div>
        <select className="form-input w-auto" value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
          <option value="">Tous les programmes</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16"><EmptyState icon={BookMarked} title="Aucun module" /></div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="table-header">Code</th>
                <th className="table-header">Nom</th>
                <th className="table-header">Programme</th>
                <th className="table-header text-center">Crédits</th>
                <th className="table-header text-center">Coeff.</th>
                <th className="table-header text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(m => {
                const prog = programs.find(p => p.id === m.program_id)
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-xs text-gray-500">{m.code}</td>
                    <td className="table-cell font-medium text-gray-800">{m.name}</td>
                    <td className="table-cell text-sm text-gray-500">{prog?.name || '—'}</td>
                    <td className="table-cell text-center text-gray-600">{m.credits}</td>
                    <td className="table-cell text-center text-gray-600">{m.coefficient}</td>
                    <td className="table-cell text-center">
                      <span className={`badge ${m.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {m.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
