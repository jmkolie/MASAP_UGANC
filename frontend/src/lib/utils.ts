import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Role } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatGrade(grade: number | null | undefined): string {
  if (grade === null || grade === undefined) return 'N/A'
  return grade.toFixed(2)
}

export function getGradeColor(grade: number | null | undefined): string {
  if (grade === null || grade === undefined) return 'text-gray-500'
  if (grade >= 16) return 'text-green-600'
  if (grade >= 14) return 'text-blue-600'
  if (grade >= 12) return 'text-sky-600'
  if (grade >= 10) return 'text-yellow-600'
  return 'text-red-600'
}

export function getMention(grade: number | null | undefined): string {
  if (grade === null || grade === undefined) return 'N/A'
  if (grade >= 16) return 'Très Bien'
  if (grade >= 14) return 'Bien'
  if (grade >= 12) return 'Assez Bien'
  if (grade >= 10) return 'Passable'
  return 'Insuffisant'
}

export function getRoleBadgeColor(role: Role): string {
  const colors: Record<Role, string> = {
    super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
    dept_head: 'bg-blue-100 text-blue-800 border-blue-200',
    teacher: 'bg-green-100 text-green-800 border-green-200',
    student: 'bg-amber-100 text-amber-800 border-amber-200',
    scolarite: 'bg-gray-100 text-gray-800 border-gray-200',
  }
  return colors[role] || 'bg-gray-100 text-gray-800'
}

export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    super_admin: 'Super Admin',
    dept_head: 'Chef de Département',
    teacher: 'Enseignant',
    student: 'Étudiant',
    scolarite: 'Scolarité',
  }
  return labels[role] || role
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getDayName(day: number): string {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  return days[day] || 'N/A'
}

export function getEnrollmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Actif',
    suspended: 'Suspendu',
    graduated: 'Diplômé',
    abandoned: 'Abandonné',
  }
  return labels[status] || status
}

export function getEnrollmentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-orange-100 text-orange-800',
    graduated: 'bg-blue-100 text-blue-800',
    abandoned: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
