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
    <div className="w-full max-w-6xl">
      <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
          <section className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary-900 via-[#6b1f33] to-[#3d0f1c] p-10 text-white">
            <div>
              <img src={UGANC_LOGO_PATH} alt={APP_NAME} className="h-auto w-28 object-contain" />
              <p className="mt-8 text-sm uppercase tracking-[0.28em] text-primary-100/80">
                Portail Universitaire
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-bold leading-tight">
                {APP_NAME}
              </h1>
              <p className="mt-4 max-w-lg text-lg text-primary-100/90">
                Plateforme centralisée pour suivre la scolarité, les évaluations et la vie académique.
              </p>
              <p className="mt-3 max-w-lg text-sm text-primary-100/75">
                {UGANC_FACULTY} — {UGANC_FULL_NAME}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: BookOpen, label: 'Modules' },
                { icon: Award, label: 'Résultats' },
                { icon: Users, label: 'Communauté' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-sm"
                >
                  <Icon className="mx-auto h-7 w-7 text-[#de5634]" />
                  <p className="mt-3 text-sm font-medium text-white">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <GraduationCap className="h-7 w-7 text-[#de5634]" />
              <p className="mt-3 text-sm leading-6 text-primary-50/90">
                Un accès simple aux parcours académiques, dans une interface alignée sur l’identité UGANC.
              </p>
            </div>
          </section>

          <section className="bg-[var(--surface-card)] px-6 py-8 sm:px-10 sm:py-10">
            <div className="mx-auto max-w-md">
              <div className="mb-8 text-center lg:hidden">
                <img src={UGANC_LOGO_PATH} alt={APP_NAME} className="mx-auto h-auto w-24 object-contain" />
                <h1 className="mt-4 text-2xl font-bold text-primary-900">{APP_NAME}</h1>
                <p className="mt-2 text-sm text-gray-500">{UGANC_FACULTY}</p>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Connectez-vous à votre espace personnel.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
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
                    <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                    Mot de passe oublié ?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-3 font-semibold text-white transition-colors duration-150 hover:bg-primary-800 disabled:bg-primary-400"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>

              <div className="mt-6 border-t border-primary-100 pt-6">
                <p className="text-center text-sm text-gray-500">
                  Pas encore de compte ?{' '}
                  <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                    Créer un compte étudiant
                  </Link>
                </p>
              </div>

              <p className="mt-8 text-center text-xs text-gray-400">
                © 2026 {APP_NAME} — Tous droits réservés
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
