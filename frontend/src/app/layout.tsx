import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MASAP-UGANC | Portail Étudiant',
  description: "Portail étudiant de l'Université — Master en Santé Publique",
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '10px', fontSize: '14px' },
              success: { style: { background: '#f0fdf4', color: '#166534' } },
              error: { style: { background: '#fef2f2', color: '#991b1b' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
