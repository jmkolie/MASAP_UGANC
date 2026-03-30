export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-[#6b1f33] flex items-center justify-center p-4">
      {children}
    </div>
  )
}
