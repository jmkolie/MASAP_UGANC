'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { APP_NAME, UGANC_LOGO_PATH } from '@/lib/branding'

const schema = z.object({
  email: z.string().email('Email invalide'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: data.email })
      setSent(true)
    } catch {
      toast.error('Une erreur est survenue. Réessayez.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-primary-900 px-8 py-8 text-center">
          <div className="flex items-center justify-center mx-auto mb-4">
            <img src={UGANC_LOGO_PATH} alt={APP_NAME} className="w-28 h-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
          <p className="text-blue-200 text-sm mt-1">Réinitialisation du mot de passe</p>
        </div>

        <div className="px-8 py-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Email envoyé</h2>
              <p className="text-sm text-gray-500 mb-6">
                Si cet email existe dans notre système, vous recevrez un lien de
                réinitialisation valable <strong>15 minutes</strong>.
              </p>
              <Link
                href="/login"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Mot de passe oublié ?</h2>
              <p className="text-sm text-gray-500 mb-6">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser
                votre mot de passe.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="form-label">Adresse email</label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="exemple@uganc.edu.gn"
                    className="form-input"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {isLoading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <p className="text-center text-blue-200 text-xs mt-6">
        © 2024 {APP_NAME} — Tous droits réservés
      </p>
    </div>
  )
}
