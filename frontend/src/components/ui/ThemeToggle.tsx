'use client'

import { Button } from '@/components/ui/Button'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

function setTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>('light')
  const isDark = theme === 'dark'

  useEffect(() => {
    const currentTheme = (document.documentElement.getAttribute('data-theme') as Theme | null) || 'light'
    setThemeState(currentTheme)
  }, [])

  const toggleTheme = () => {
    const nextTheme: Theme = isDark ? 'light' : 'dark'
    setThemeState(nextTheme)
    setTheme(nextTheme)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative text-primary-700"
      aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
      title={isDark ? 'Thème clair' : 'Thème sombre'}
    >
      <Sun className={`h-5 w-5 transition-all ${isDark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 opacity-100'}`} />
      <Moon className={`absolute h-5 w-5 transition-all ${isDark ? 'scale-100 opacity-100' : 'scale-0 -rotate-90 opacity-0'}`} />
    </Button>
  )
}
