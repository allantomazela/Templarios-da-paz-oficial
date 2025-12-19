import { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { Loader2 } from 'lucide-react'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: string[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading } = useAuthStore()
  const [isTimeout, setIsTimeout] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (loading) {
      timer = setTimeout(() => {
        setIsTimeout(true)
      }, 5000)
    }
    return () => clearTimeout(timer)
  }, [loading])

  if (loading) {
    if (isTimeout) {
      // If loading stuck, assume not authorized or error, redirect to dashboard root
      return <Navigate to="/dashboard" replace />
    }
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Check if user has role
  // Master Admin bypass: always treat as 'admin' if email matches
  const isMasterAdmin = user?.email === 'allantomazela@gmail.com'
  let userRole = user?.role || 'member'

  if (isMasterAdmin) {
    userRole = 'admin'
  }

  if (!allowedRoles.includes(userRole)) {
    // If admin tries to access user stuff, usually okay, but here strict.
    // Redirect to dashboard root if unauthorized
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
