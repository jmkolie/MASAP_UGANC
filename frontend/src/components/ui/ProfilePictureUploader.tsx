'use client'

import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Camera, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface ProfilePictureUploaderProps {
  currentImage?: string | null
  initials: string
  alt: string
  uploading?: boolean
  onFileSelect: (file: File) => Promise<void> | void
}

export function ProfilePictureUploader({
  currentImage,
  initials,
  alt,
  uploading = false,
  onFileSelect,
}: ProfilePictureUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const displayedImage = previewUrl || currentImage || null

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    await onFileSelect(file)
    event.target.value = ''
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="relative group">
        <Avatar
          src={displayedImage}
          alt={alt}
          initials={initials}
          size="xl"
          className="rounded-2xl border-4 border-white shadow-md"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-70"
          title="Changer la photo"
        >
          {uploading ? (
            <span className="h-7 w-7 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" icon={Upload} onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Envoi...' : 'Choisir une image'}
        </Button>
      </div>

      <p className="text-xs text-gray-500">Formats acceptés: JPG, PNG, WEBP. Taille max: 5 Mo.</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  )
}
