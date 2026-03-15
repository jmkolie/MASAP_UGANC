'use client'
import { useState, useRef } from 'react'
import { Save, User, Mail, Phone, Lock, Eye, EyeOff, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { getRoleLabel } from '@/lib/utils'
import api from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AdminProfilePage() {
  const { user, refetch } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPwdForm, setShowPwdForm] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refetch()
      toast.success('Photo mise à jour')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de l\'upload')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  })
  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', confirm: '' })

  if (!user) return <PageLoader />

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/users/${user.id}`, form)
      await refetch()
      toast.success('Profil mis à jour')
      setEditing(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwdForm.new_password !== pwdForm.confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    setSaving(true)
    try {
      await api.post('/auth/change-password', {
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      })
      toast.success('Mot de passe modifié')
      setShowPwdForm(false)
      setPwdForm({ old_password: '', new_password: '', confirm: '' })
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Mot de passe actuel incorrect')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gérer vos informations personnelles</p>
      </div>

      {/* Avatar + info card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-primary-700 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
              {user.profile_picture ? (
                <img src={`${API_URL}${user.profile_picture}`} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <>{user.first_name[0]}{user.last_name[0]}</>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
              title="Changer la photo"
            >
              <Camera className="w-3 h-3 text-gray-600" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.first_name} {user.last_name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
              {getRoleLabel(user.role)}
            </span>
          </div>
          {!editing && (
            <button
              onClick={() => { setForm({ first_name: user.first_name, last_name: user.last_name, phone: user.phone || '' }); setEditing(true) }}
              className="ml-auto btn-secondary text-sm"
            >
              Modifier
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Prénom</label>
                <input className="form-input" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
              </div>
              <div>
                <label className="form-label">Nom</label>
                <input className="form-input" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Téléphone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+224 6XX XXX XXX" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Annuler</button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Prénom', value: user.first_name, icon: User },
              { label: 'Nom', value: user.last_name, icon: User },
              { label: 'Email', value: user.email, icon: Mail },
              { label: 'Téléphone', value: user.phone || '—', icon: Phone },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-medium text-gray-800">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Mot de passe</h3>
          </div>
          {!showPwdForm && (
            <button onClick={() => setShowPwdForm(true)} className="btn-secondary text-sm">
              Changer
            </button>
          )}
        </div>

        {showPwdForm ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="form-label">Mot de passe actuel</label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  className="form-input pr-10"
                  value={pwdForm.old_password}
                  onChange={e => setPwdForm({ ...pwdForm, old_password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="form-label">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  className="form-input pr-10"
                  value={pwdForm.new_password}
                  onChange={e => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                  required minLength={8}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="form-label">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                className="form-input"
                value={pwdForm.confirm}
                onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button type="button" onClick={() => setShowPwdForm(false)} className="btn-secondary">Annuler</button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500">••••••••••••</p>
        )}
      </div>
    </div>
  )
}
