'use client'
import { useState, useRef } from 'react'
import { Upload, X, Camera } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import toast from 'react-hot-toast'
import api from '@/lib/api'

interface ProfilePictureUploaderProps {
  currentPicture?: string
  userId: number
  onUploadSuccess?: (url: string) => void
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function ProfilePictureUploader({
  currentPicture,
  userId,
  onUploadSuccess,
  size = 'lg',
}: ProfilePictureUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentPicture || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const fullImageUrl = preview?.startsWith('http') ? preview : `${API_URL}${preview}`

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('profile_picture', file)

      const response = await api.post(`/users/${userId}/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const imageUrl = response.data.profile_picture_url || response.data.profile_picture
      
      setPreview(imageUrl)
      toast.success('Photo de profil mise à jour avec succès')
      onUploadSuccess?.(imageUrl)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error?.response?.data?.detail || 'Erreur lors du téléchargement')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePicture = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) return

    setIsUploading(true)
    try {
      await api.delete(`/users/${userId}/profile-picture`)
      setPreview(null)
      toast.success('Photo de profil supprimée')
      onUploadSuccess?.('')
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Erreur lors de la suppression')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar src={fullImageUrl} size={size} className="ring-4 ring-white shadow-lg" />
        
        {/* Overlay on hover */}
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer disabled:opacity-50"
          aria-label="Changer la photo"
        >
          {isUploading ? (
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Remove button */}
        {preview && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRemovePicture()
            }}
            disabled={isUploading}
            className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
            aria-label="Supprimer la photo"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Helper text */}
      <div className="text-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClick}
          disabled={isUploading}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? 'Téléchargement...' : preview ? 'Changer la photo' : 'Ajouter une photo'}
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          JPG, PNG ou GIF • Max 5MB
        </p>
      </div>
    </div>
  )
}

// Simple avatar display component with fallback
interface UserAvatarDisplayProps {
  user: {
    first_name: string
    last_name: string
    profile_picture?: string
  }
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
}

export function UserAvatarDisplay({ user, size = 'md', showName = false }: UserAvatarDisplayProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const fullName = `${user.first_name} ${user.last_name}`
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
  const avatarSrc = user.profile_picture 
    ? (user.profile_picture.startsWith('http') ? user.profile_picture : `${API_URL}${user.profile_picture}`)
    : undefined

  if (showName) {
    return (
      <div className="flex items-center gap-3">
        <Avatar src={avatarSrc} initials={initials} size={size} />
        <div>
          <p className="text-sm font-medium text-gray-900">{fullName}</p>
          <p className="text-xs text-gray-500">{user.first_name}</p>
        </div>
      </div>
    )
  }

  return <Avatar src={avatarSrc} initials={initials} size={size} />
}
