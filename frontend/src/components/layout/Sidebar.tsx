'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, Calendar,
  Bell, FileText, Settings, Award, ClipboardList, BarChart3,
  Home, User, BookMarked, Star, Download, Clock, MessageSquare,
  CheckSquare, ChevronRight, Building, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Role } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const adminNav: NavItem[] = [
  { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users },
  { label: 'Facultés & Dépmt.', href: '/admin/departements', icon: Building },
  { label: 'Programmes', href: '/admin/programmes', icon: BookOpen },
  { label: 'Années Académiques', href: '/admin/annees-academiques', icon: Calendar },
  { label: 'Promotions', href: '/admin/promotions', icon: GraduationCap },
  { label: 'Modules', href: '/admin/modules', icon: BookMarked },
  { label: 'Annonces', href: '/admin/annonces', icon: Bell },
  { label: 'Paramètres', href: '/admin/parametres', icon: Settings },
]

const deptHeadNav: NavItem[] = [
  { label: 'Tableau de bord', href: '/dept-head', icon: LayoutDashboard },
  { label: 'Promotions', href: '/dept-head/promotions', icon: GraduationCap },
  { label: 'Modules', href: '/dept-head/modules', icon: BookMarked },
  { label: 'Validation des notes', href: '/dept-head/validation-notes', icon: CheckSquare },
  { label: 'Génération PV', href: '/dept-head/pv', icon: FileText },
  { label: 'Rapports', href: '/dept-head/rapports', icon: BarChart3 },
  { label: 'Emploi du temps', href: '/dept-head/emploi-du-temps', icon: Clock },
]

const teacherNav: NavItem[] = [
  { label: 'Tableau de bord', href: '/teacher', icon: LayoutDashboard },
  { label: 'Mes modules', href: '/teacher/mes-modules', icon: BookMarked },
  { label: 'Mes étudiants', href: '/teacher/mes-etudiants', icon: Users },
  { label: 'Saisie des notes', href: '/teacher/saisie-notes', icon: ClipboardList },
  { label: 'Documents de cours', href: '/teacher/documents', icon: FileText },
  { label: 'Devoirs', href: '/teacher/devoirs', icon: Award },
  { label: 'Annonces', href: '/teacher/annonces', icon: Bell },
]

const studentNav: NavItem[] = [
  { label: 'Tableau de bord', href: '/student', icon: LayoutDashboard },
  { label: 'Mon profil', href: '/student/mon-profil', icon: User },
  { label: 'Mes modules', href: '/student/mes-modules', icon: BookMarked },
  { label: 'Mes notes', href: '/student/mes-notes', icon: Star },
  { label: 'Mes relevés', href: '/student/mes-releves', icon: Download },
  { label: 'Documents', href: '/student/documents', icon: FileText },
  { label: 'Emploi du temps', href: '/student/emploi-du-temps', icon: Clock },
  { label: 'Annonces', href: '/student/annonces', icon: Bell },
  { label: 'Messages', href: '/student/messages', icon: MessageSquare },
]

const navByRole: Record<Role, NavItem[]> = {
  super_admin: adminNav,
  dept_head: deptHeadNav,
  teacher: teacherNav,
  student: studentNav,
  scolarite: adminNav,
}

interface SidebarProps {
  role: Role
  userName: string
  collapsed?: boolean
}

export function Sidebar({ role, userName, collapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const navItems = navByRole[role] || adminNav

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-primary-900 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-primary-800">
        <div className="flex-shrink-0">
          <img
            src="/logo.png"
            alt="FSTS-UGANC"
            className={collapsed ? 'w-9 h-9 object-contain' : 'w-12 h-12 object-contain'}
          />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight">MASAP-UGANC</p>
            <p className="text-xs text-blue-300 leading-tight">FSTS-UGANC</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary-700 text-white'
                  : 'text-blue-200 hover:bg-primary-800 hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && isActive && (
                <ChevronRight className="w-3 h-3 ml-auto text-blue-300" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User info at bottom */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-primary-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-blue-400">Connecté</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
