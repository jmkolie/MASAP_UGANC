'use client'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import Cookies from 'js-cookie'
import { getCurrentUser } from '@/lib/auth'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  refetch: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    const token = Cookies.get('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const u = await getCurrentUser()
      setUser(u)
    } catch {
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
