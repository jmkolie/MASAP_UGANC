import Cookies from 'js-cookie'
import api from './api'
import type { User, Role } from '@/types'

export type { User }

export async function login(email: string, password: string) {
  const formData = new FormData()
  formData.append('username', email)
  formData.append('password', password)
  const response = await api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const { access_token, refresh_token } = response.data
  Cookies.set('access_token', access_token, { expires: 1, secure: false, sameSite: 'lax' })
  Cookies.set('refresh_token', refresh_token, { expires: 7, secure: false, sameSite: 'lax' })
  return response.data
}

export function logout() {
  Cookies.remove('access_token')
  Cookies.remove('refresh_token')
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get('/auth/me')
  return response.data
}

export function getDashboardPath(role: Role): string {
  const paths: Record<Role, string> = {
    super_admin: '/admin',
    dept_head: '/dept-head',
    teacher: '/teacher',
    student: '/student',
    scolarite: '/scolarite',
  }
  return paths[role] || '/login'
}

export function isAuthenticated(): boolean {
  return !!Cookies.get('access_token')
}
