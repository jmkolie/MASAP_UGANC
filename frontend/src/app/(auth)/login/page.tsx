'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { login, getDashboardPath } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { refetch } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      await refetch()
      toast.success('Connexion réussie !')
      const updatedUser = await import('@/lib/auth').then((m) => m.getCurrentUser())
      router.replace(getDashboardPath(updatedUser.role))
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Email ou mot de passe incorrect'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary-900 px-8 py-8 text-center">
          <div className="flex items-center justify-center mx-auto mb-4">
            <img src="/logo.png" alt="FSTS-UGANC" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">MASAP-UGANC</h1>
          <p className="text-blue-200 text-sm mt-1">Portail Étudiant Universitaire</p>
          <p className="text-blue-300 text-xs mt-0.5">FSTS — Université Gamal Abdel Nasser de Conakry</p>
        </div>

        {/* Form */}
        <div className="px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Connexion à votre compte</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">Adresse email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="exemple@masap.edu"
                className="form-input"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Mot de passe</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

      </div>

      <p className="text-center text-blue-200 text-xs mt-6">
        © 2024 MASAP-UGANC — Tous droits réservés
      </p>
    </div>
  )
}
