'use client'
import { useState, useRef } from 'react'
import { User, Mail, Phone, MapPin, Calendar, Award, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, getEnrollmentStatusLabel, getEnrollmentStatusColor } from '@/lib/utils'
import api from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function MonProfilPage() {
  const { user, refetch } = useAuth()
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

  if (!user) return null

  const profile = user.student_profile

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 text-sm mt-1">Vos informations personnelles et académiques</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-primary-700 to-primary-900" />

        {/* Avatar & name */}
        <div className="px-6 pb-5">
          <div className="-mt-10 flex items-end gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold text-primary-700 overflow-hidden">
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
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
                title="Changer la photo"
              >
                <Camera className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-gray-900">
                {user.first_name} {user.last_name}
              </h2>
              {profile && (
                <p className="text-sm text-gray-500 font-mono">{profile.student_id}</p>
              )}
            </div>
          </div>

          {profile && (
            <span className={`badge ${getEnrollmentStatusColor(profile.enrollment_status)}`}>
              {getEnrollmentStatusLabel(profile.enrollment_status)}
            </span>
          )}
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Informations personnelles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={Mail} label="Email" value={user.email} />
          <InfoRow icon={Phone} label="Téléphone" value={user.phone || 'Non renseigné'} />
          {profile && (
            <>
              <InfoRow
                icon={Calendar}
                label="Date de naissance"
                value={profile.date_of_birth ? formatDate(profile.date_of_birth) : 'Non renseignée'}
              />
              <InfoRow icon={User} label="Nationalité" value={profile.nationality || 'Non renseignée'} />
              <InfoRow icon={MapPin} label="Adresse" value={profile.address || 'Non renseignée'} />
              {profile.promotion_year && (
                <InfoRow icon={Award} label="Année de promotion" value={String(profile.promotion_year)} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Informations du compte</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={Calendar} label="Compte créé le" value={formatDate(user.created_at)} />
          <InfoRow
            icon={User}
            label="Statut"
            value={user.is_active ? 'Actif' : 'Inactif'}
          />
          {user.last_login && (
            <InfoRow icon={Calendar} label="Dernière connexion" value={formatDate(user.last_login)} />
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  )
}
