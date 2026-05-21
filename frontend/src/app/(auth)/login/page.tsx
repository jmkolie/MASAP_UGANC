'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn, GraduationCap, BookOpen, Users, Award } from 'lucide-react'
import Link from 'next/link'
import { login, getDashboardPath } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { APP_NAME, UGANC_FULL_NAME, UGANC_FACULTY, UGANC_LOGO_PATH } from '@/lib/branding'

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
    <div className="min-h-screen flex bg-gradient-to-br from-[#531628] via-[#6b1f33] to-[#3d0f1c] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#de5634]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Left side - Branding & Illustration */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center items-center p-12 relative z-10">
        <div className="max-w-lg text-center space-y-8 animate-in fade-in slide-in-from-left duration-700">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 mb-6">
              <img src={UGANC_LOGO_PATH} alt={APP_NAME} className="w-24 h-auto object-contain drop-shadow-2xl" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              {APP_NAME}
            </h1>
            <p className="text-xl text-blue-200">{UGANC_FACULTY}</p>
            <p className="text-sm text-blue-300">{UGANC_FULL_NAME}</p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-4 mt-12">
            {[
              { icon: BookOpen, label: 'Modules', color: 'bg-white/10' },
              { icon: Award, label: 'Notes', color: 'bg-white/10' },
              { icon: Users, label: 'Communauté', color: 'bg-white/10' },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className={`${color} backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1`}
              >
                <Icon className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="text-xs text-blue-200 font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Decorative quote */}
          <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <GraduationCap className="w-8 h-8 text-[#de5634] mx-auto mb-3" />
            <p className="text-white/90 text-sm italic">
              "L'excellence académique au service de la santé publique en Afrique"
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right duration-700">
          {/* Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            {/* Header - Mobile only logo */}
            <div className="lg:hidden bg-primary-900 px-8 py-6 text-center">
              <img src={UGANC_LOGO_PATH} alt={APP_NAME} className="w-20 h-auto object-contain mx-auto" />
              <h1 className="text-xl font-bold text-white mt-3">{APP_NAME}</h1>
              <p className="text-blue-200 text-xs mt-1">Portail Étudiant Universitaire</p>
            </div>

            {/* Form */}
            <div className="px-8 py-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Bon retour ! 👋</h2>
                <p className="text-gray-500 text-sm mt-1">Connectez-vous à votre espace personnel</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="form-label">Adresse email</label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="exemple@masap.edu"
                    className="form-input transition-all duration-200 focus:scale-[1.01]"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 animate-in slide-in-from-top">{errors.email.message}</p>
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
                      className="form-input pr-10 transition-all duration-200 focus:scale-[1.01]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1 animate-in slide-in-from-top">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                    Mot de passe oublié ?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-primary-700 to-primary-800 hover:from-primary-800 hover:to-primary-900 disabled:from-primary-400 disabled:to-primary-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  )}
                  <span className="relative">
                    {isLoading ? 'Connexion...' : 'Se connecter'}
                  </span>
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-center text-sm text-gray-500">
                  Pas encore de compte ?{' '}
                  <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors hover:underline">
                    Créer un compte étudiant
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer info */}
          <p className="text-center text-blue-200/80 text-xs mt-6">
            © 2025 {APP_NAME} — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  )
}
