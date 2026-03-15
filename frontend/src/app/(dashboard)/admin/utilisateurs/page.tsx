'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Search, UserCheck, UserX, Edit, Trash2, Download, Upload, X, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { getRoleLabel, getRoleBadgeColor, formatDate } from '@/lib/utils'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import type { User, Role } from '@/types'

const ROLES: { value: Role | ''; label: string }[] = [
  { value: '', label: 'Tous les rôles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'dept_head', label: 'Chef de Département' },
  { value: 'teacher', label: 'Enseignant' },
  { value: 'student', label: 'Étudiant' },
  { value: 'scolarite', label: 'Scolarité' },
]

interface EditForm { first_name: string; last_name: string; phone: string; role: Role; is_active: boolean }
interface CreateForm { first_name: string; last_name: string; email: string; phone: string; password: string; role: Role }

const DEFAULT_CREATE: CreateForm = { first_name: '', last_name: '', email: '', phone: '', password: '', role: 'student' }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ first_name: '', last_name: '', phone: '', role: 'student', is_active: true })
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(DEFAULT_CREATE)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null)
  const importFileRef = useRef<HTMLInputElement>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, per_page: 20 }
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      const res = await api.get('/users', { params })
      setUsers(res.data.items)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch {
      toast.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer l'utilisateur "${name}" ? Cette action est irréversible.`)) return
    try {
      await api.delete(`/users/${id}`)
      toast.success('Utilisateur supprimé')
      fetchUsers()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const toggleActive = async (user: User) => {
    try {
      await api.put(`/users/${user.id}`, { is_active: !user.is_active })
      toast.success(`Compte ${user.is_active ? 'désactivé' : 'activé'}`)
      fetchUsers()
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const openEdit = (user: User) => {
    setEditUser(user)
    setEditForm({ first_name: user.first_name, last_name: user.last_name, phone: user.phone || '', role: user.role, is_active: user.is_active })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/users', createForm)
      toast.success('Utilisateur créé avec succès')
      setShowCreate(false)
      setCreateForm(DEFAULT_CREATE)
      fetchUsers()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setSaving(true)
    try {
      await api.put(`/users/${editUser.id}`, editForm)
      toast.success('Utilisateur mis à jour')
      setEditUser(null)
      fetchUsers()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      const res = await api.get('/users/export-csv', { params, responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'utilisateurs.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export téléchargé')
    } catch {
      toast.error('Erreur lors de l\'export')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/users/import-csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setImportResult({ created: res.data.created, errors: res.data.errors || [] })
      if (res.data.created > 0) fetchUsers()
      toast.success(res.data.message)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de l\'import')
    } finally {
      setImporting(false)
      if (importFileRef.current) importFileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} utilisateur(s) au total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as Role | ''); setPage(1) }}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white min-w-[180px]"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">{exporting ? 'Export...' : 'Exporter'}</span>
          </button>
          <button
            onClick={() => { setShowImport(true); setImportResult(null) }}
            className="flex items-center gap-2 px-3 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Importer</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : users.length === 0 ? (
          <EmptyState
            title="Aucun utilisateur trouvé"
            description="Modifiez vos critères de recherche ou créez un nouvel utilisateur."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="table-header">Utilisateur</th>
                    <th className="table-header">Email</th>
                    <th className="table-header">Rôle</th>
                    <th className="table-header">Statut</th>
                    <th className="table-header">Créé le</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                            {user.first_name[0]}{user.last_name[0]}
                          </div>
                          <span className="font-medium text-gray-800">
                            {user.first_name} {user.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell text-gray-500">{user.email}</td>
                      <td className="table-cell">
                        <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${user.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="table-cell text-gray-500">{formatDate(user.created_at)}</td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleActive(user)}
                            className={`p-1.5 rounded-md transition-colors ${user.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                            title={user.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openEdit(user)} className="p-1.5 rounded-md text-blue-500 hover:bg-blue-50 transition-colors" title="Modifier">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`)}
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <Pagination
                page={page}
                totalPages={pages}
                onPageChange={setPage}
                total={total}
                perPage={20}
              />
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">Nouvel utilisateur</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Prénom *</label>
                  <input className="form-input" value={createForm.first_name} onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Nom *</label>
                  <input className="form-input" value={createForm.last_name} onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} required />
              </div>
              <div>
                <label className="form-label">Téléphone</label>
                <input className="form-input" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="+224 6XX XXX XXX" />
              </div>
              <div>
                <label className="form-label">Rôle *</label>
                <select className="form-input" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value as Role })}>
                  {ROLES.filter(r => r.value).map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Mot de passe *</label>
                <input type="password" className="form-input" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} required minLength={8} placeholder="Minimum 8 caractères" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                  <Save className="w-4 h-4" />{saving ? 'Création...' : 'Créer l\'utilisateur'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">Importer des utilisateurs (CSV)</h3>
              <button onClick={() => setShowImport(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700 space-y-1">
                <p className="font-medium">Format CSV attendu :</p>
                <p className="font-mono text-xs">email, first_name, last_name, phone, password, role</p>
                <p className="text-xs text-blue-600 mt-1">
                  • <strong>role</strong> : student, teacher, scolarite, dept_head, super_admin (défaut: student)<br />
                  • <strong>password</strong> : optionnel (défaut: Masap@2024!)<br />
                  • <strong>phone</strong> : optionnel
                </p>
              </div>

              <div>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImport}
                />
                <button
                  onClick={() => importFileRef.current?.click()}
                  disabled={importing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-primary-400 transition-colors disabled:opacity-60"
                >
                  <Upload className="w-5 h-5" />
                  {importing ? 'Import en cours...' : 'Choisir un fichier CSV'}
                </button>
              </div>

              {importResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-4 py-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{importResult.created} utilisateur(s) importé(s) avec succès</span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="bg-red-50 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 text-red-700 text-sm font-medium mb-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {importResult.errors.length} erreur(s)
                      </div>
                      <ul className="space-y-0.5 max-h-32 overflow-y-auto">
                        {importResult.errors.map((err, i) => (
                          <li key={i} className="text-xs text-red-600">{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={() => setShowImport(false)} className="btn-secondary">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">Modifier l'utilisateur</h3>
              <button onClick={() => setEditUser(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Prénom</label>
                  <input className="form-input" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Nom</label>
                  <input className="form-input" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="form-label">Téléphone</label>
                <input className="form-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+224 6XX XXX XXX" />
              </div>
              <div>
                <label className="form-label">Rôle</label>
                <select className="form-input" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value as Role })}>
                  {ROLES.filter(r => r.value).map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={editForm.is_active} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })} className="rounded" />
                <label htmlFor="active" className="text-sm text-gray-700 cursor-pointer">Compte actif</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                  <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => setEditUser(null)} className="btn-secondary">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
