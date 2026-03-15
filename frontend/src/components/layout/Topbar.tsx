'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, User, LogOut, Settings, Menu, ChevronDown } from 'lucide-react'
import { logout } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleLabel, getRoleBadgeColor } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

interface TopbarProps {
  onToggleSidebar?: () => void
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
    logout()
  }

  const fullName = user ? `${user.first_name} ${user.last_name}` : ''
  const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : 'U'
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const avatarSrc = user?.profile_picture ? `${API_URL}${user.profile_picture}` : null

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
              {avatarSrc ? (
                <img src={avatarSrc} alt={fullName} className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-tight">{fullName}</p>
              {user && (
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor(user.role)}`}
                >
                  {getRoleLabel(user.role)}
                </span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">{fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    setShowDropdown(false)
                    const role = user?.role
                    if (role === 'student') router.push('/student/mon-profil')
                    else if (role === 'teacher') router.push('/teacher/mon-profil')
                    else router.push('/admin/mon-profil')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Mon profil
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false)
                    const role = user?.role
                    if (role === 'super_admin' || role === 'scolarite') router.push('/admin/parametres')
                    else if (role === 'dept_head') router.push('/dept-head/parametres')
                    else router.push('/admin/parametres')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Paramètres
                </button>

                <hr className="my-1 border-gray-100" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
