'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Building } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import api from '@/lib/api'

interface Department { id: number; name: string; code: string; faculty_id: number; description?: string; created_at: string }
interface Faculty { id: number; name: string; code: string }

export default function DepartementsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', faculty_id: '', description: '' })

  useEffect(() => {
    Promise.all([api.get('/academic/departments'), api.get('/academic/faculties')])
      .then(([depts, facs]) => { setDepartments(depts.data); setFaculties(facs.data) })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/academic/departments', { ...form, faculty_id: parseInt(form.faculty_id) })
      toast.success('Département créé !')
      setShowForm(false)
      setForm({ name: '', code: '', faculty_id: '', description: '' })
      const res = await api.get('/academic/departments')
      setDepartments(res.data)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la création')
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return
    try {
      await api.delete(`/academic/departments/${id}`)
      toast.success('Département supprimé')
      setDepartments(prev => prev.filter(d => d.id !== id))
    } catch { toast.error('Erreur lors de la suppression') }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Départements</h1>
          <p className="text-gray-500 text-sm mt-0.5">{departments.length} département(s)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouveau département
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Nouveau département</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nom</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Code</label>
              <input className="form-input" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Faculté</label>
              <select className="form-input" value={form.faculty_id} onChange={e => setForm({...form, faculty_id: e.target.value})} required>
                <option value="">Sélectionner...</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Créer</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {departments.length === 0 ? (
          <div className="py-16"><EmptyState icon={Building} title="Aucun département" /></div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="table-header">Nom</th>
                <th className="table-header">Code</th>
                <th className="table-header">Faculté</th>
                <th className="table-header">Description</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {departments.map(d => {
                const faculty = faculties.find(f => f.id === d.faculty_id)
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium text-gray-800">{d.name}</td>
                    <td className="table-cell font-mono text-xs text-gray-500">{d.code}</td>
                    <td className="table-cell text-gray-500">{faculty?.name || '—'}</td>
                    <td className="table-cell text-gray-400 max-w-xs truncate">{d.description || '—'}</td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(d.id, d.name)} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
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
