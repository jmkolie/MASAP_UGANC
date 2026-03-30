'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { APP_NAME, UGANC_LOGO_PATH } from '@/lib/branding'

const schema = z.object({
  new_password: z.string().min(8, 'Au moins 8 caractères'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!token) {
      toast.error('Lien de réinitialisation invalide.')
      router.replace('/forgot-password')
    }
  }, [token, router])

  const onSubmit = async (data: FormData) => {
    if (!token) return
    setIsLoading(true)
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: data.new_password,
      })
      setSuccess(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Lien invalide ou expiré.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Mot de passe modifié</h2>
        <p className="text-sm text-gray-500 mb-6">
          Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant
          vous connecter.
        </p>
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Choisir un nouveau mot de passe</h2>
      <p className="text-sm text-gray-500 mb-6">
        Votre nouveau mot de passe doit contenir au moins 8 caractères.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="form-label">Nouveau mot de passe</label>
          <div className="relative">
            <input
              {...register('new_password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="form-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.new_password && (
            <p className="text-red-500 text-xs mt-1">{errors.new_password.message}</p>
          )}
        </div>

        <div>
          <label className="form-label">Confirmer le mot de passe</label>
          <div className="relative">
            <input
              {...register('confirm_password')}
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="form-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : null}
          {isLoading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-primary-900 px-8 py-8 text-center">
          <div className="flex items-center justify-center mx-auto mb-4">
            <img src={UGANC_LOGO_PATH} alt={APP_NAME} className="w-28 h-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
          <p className="text-blue-200 text-sm mt-1">Nouveau mot de passe</p>
        </div>

        <div className="px-8 py-8">
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>

      <p className="text-center text-blue-200 text-xs mt-6">
        © 2024 {APP_NAME} — Tous droits réservés
      </p>
    </div>
  )
}
