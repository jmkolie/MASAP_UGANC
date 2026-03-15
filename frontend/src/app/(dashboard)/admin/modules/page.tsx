'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, BookMarked } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import api from '@/lib/api'
import type { Module, Program } from '@/types'

export default function ModulesAdminPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', program_id: '', credits: '3', coefficient: '1', description: '' })

  const fetchModules = async () => {
    try {
      const res = await api.get('/academic/modules')
      setModules(res.data || [])
      setTotal(res.data?.length || 0)
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    Promise.all([fetchModules(), api.get('/academic/programs')])
      .then(([_, progRes]) => setPrograms(progRes.data))
      .catch(() => {})
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/academic/modules', {
        name: form.name, code: form.code,
        program_id: form.program_id ? parseInt(form.program_id) : null,
        credits: parseInt(form.credits), coefficient: parseInt(form.coefficient),
        description: form.description, is_active: true
      })
      toast.success('Module créé !')
      setShowForm(false)
      setForm({ name: '', code: '', program_id: '', credits: '3', coefficient: '1', description: '' })
      fetchModules()
    } catch (err: any) { toast.error(err?.response?.data?.detail || 'Erreur') }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer le module "${name}" ?`)) return
    try {
      await api.delete(`/academic/modules/${id}`)
      toast.success('Module supprimé')
      fetchModules()
    } catch { toast.error('Erreur lors de la suppression') }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modules / UE</h1>
          <p className="text-gray-500 text-sm mt-0.5">{modules.length} module(s) au total</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" />Nouveau module
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Nouveau module</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="form-label">Nom</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><label className="form-label">Code</label><input className="form-input" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required /></div>
            <div>
              <label className="form-label">Programme</label>
              <select className="form-input" value={form.program_id} onChange={e => setForm({...form, program_id: e.target.value})}>
                <option value="">Aucun</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div><label className="form-label">Crédits</label><input type="number" min="1" max="30" className="form-input" value={form.credits} onChange={e => setForm({...form, credits: e.target.value})} /></div>
            <div><label className="form-label">Coefficient</label><input type="number" min="1" max="10" className="form-input" value={form.coefficient} onChange={e => setForm({...form, coefficient: e.target.value})} /></div>
            <div><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Créer</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {modules.length === 0 ? (
          <div className="py-16"><EmptyState icon={BookMarked} title="Aucun module" /></div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="table-header">Code</th>
                <th className="table-header">Nom</th>
                <th className="table-header text-center">Crédits</th>
                <th className="table-header text-center">Coeff.</th>
                <th className="table-header text-center">Statut</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {modules.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono text-xs text-gray-500">{m.code}</td>
                  <td className="table-cell font-medium text-gray-800">{m.name}</td>
                  <td className="table-cell text-center text-gray-600">{m.credits}</td>
                  <td className="table-cell text-center text-gray-600">{m.coefficient}</td>
                  <td className="table-cell text-center">
                    <span className={`badge ${m.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {m.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(m.id, m.name)} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
