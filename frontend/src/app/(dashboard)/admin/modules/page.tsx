'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, BookMarked, UserPlus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import api from '@/lib/api'
import type { Module, Program, User, AcademicYear } from '@/types'

interface TeacherAssignment {
  id: number
  teacher_id: number
  module_id: number
  academic_year_id: number
  is_primary: boolean
  teacher_name: string
}

export default function ModulesAdminPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [teachers, setTeachers] = useState<User[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', program_id: '', credits: '3', coefficient: '1', description: '' })

  // Affectation modal state
  const [affectModule, setAffectModule] = useState<Module | null>(null)
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignForm, setAssignForm] = useState({ teacher_id: '', academic_year_id: '' })
  const [assigning, setAssigning] = useState(false)

  const fetchModules = async () => {
    try {
      const res = await api.get('/academic/modules')
      setModules(res.data || [])
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    Promise.all([
      fetchModules(),
      api.get('/academic/programs'),
      api.get('/users/teachers/list?limit=200'),
      api.get('/academic/academic-years'),
    ]).then(([_, progRes, teachRes, yearRes]) => {
      setPrograms(progRes.data || [])
      setTeachers(teachRes.data?.items || teachRes.data || [])
      setAcademicYears(yearRes.data || [])
    }).catch(() => {})
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

  const openAffect = async (m: Module) => {
    setAffectModule(m)
    setAssignLoading(true)
    try {
      const res = await api.get(`/academic/modules/${m.id}/teachers`)
      setAssignments(res.data || [])
    } catch { toast.error('Erreur de chargement') }
    finally { setAssignLoading(false) }
    // Pre-select current academic year
    const current = academicYears.find(y => (y as any).is_current)
    setAssignForm({ teacher_id: '', academic_year_id: current ? String(current.id) : '' })
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!affectModule || !assignForm.teacher_id || !assignForm.academic_year_id) return
    setAssigning(true)
    try {
      await api.post(`/academic/modules/${affectModule.id}/assign-teacher`, {
        teacher_id: parseInt(assignForm.teacher_id),
        module_id: affectModule.id,
        academic_year_id: parseInt(assignForm.academic_year_id),
        is_primary: true,
      })
      toast.success('Enseignant affecté !')
      const res = await api.get(`/academic/modules/${affectModule.id}/teachers`)
      setAssignments(res.data || [])
      setAssignForm(f => ({ ...f, teacher_id: '' }))
    } catch (err: any) { toast.error(err?.response?.data?.detail || 'Erreur') }
    finally { setAssigning(false) }
  }

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!affectModule) return
    if (!confirm('Retirer cet enseignant du module ?')) return
    try {
      await api.delete(`/academic/modules/${affectModule.id}/teachers/${assignmentId}`)
      setAssignments(prev => prev.filter(a => a.id !== assignmentId))
      toast.success('Affectation retirée')
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
                      <button
                        onClick={() => openAffect(m)}
                        title="Affecter un enseignant"
                        className="p-1.5 rounded text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(m.id, m.name)} className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Affectation Modal */}
      {affectModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Affecter un enseignant</h2>
                <p className="text-xs text-gray-500 mt-0.5">{affectModule.code} — {affectModule.name}</p>
              </div>
              <button onClick={() => setAffectModule(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Current assignments */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Enseignants affectés</p>
                {assignLoading ? (
                  <p className="text-sm text-gray-400">Chargement...</p>
                ) : assignments.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucun enseignant affecté</p>
                ) : (
                  <ul className="space-y-2">
                    {assignments.map(a => (
                      <li key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-700">{a.teacher_name}</span>
                        <button
                          onClick={() => handleRemoveAssignment(a.id)}
                          className="text-red-400 hover:text-red-600 p-1 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* New assignment form */}
              <form onSubmit={handleAssign} className="space-y-3 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nouvelle affectation</p>
                <div>
                  <label className="form-label">Enseignant</label>
                  <select
                    className="form-input"
                    value={assignForm.teacher_id}
                    onChange={e => setAssignForm(f => ({ ...f, teacher_id: e.target.value }))}
                    required
                  >
                    <option value="">Sélectionner un enseignant</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Année académique</label>
                  <select
                    className="form-input"
                    value={assignForm.academic_year_id}
                    onChange={e => setAssignForm(f => ({ ...f, academic_year_id: e.target.value }))}
                    required
                  >
                    <option value="">Sélectionner une année</option>
                    {academicYears.map(y => (
                      <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={assigning} className="btn-primary">
                    {assigning ? 'Affectation...' : 'Affecter'}
                  </button>
                  <button type="button" onClick={() => setAffectModule(null)} className="btn-secondary">Fermer</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
