'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardPath } from '@/lib/auth'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace(getDashboardPath(user.role))
      } else {
        router.replace('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-900">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-university-gold mx-auto mb-4" />
        <p className="text-blue-200 text-sm">Chargement...</p>
      </div>
    </div>
  )
}
