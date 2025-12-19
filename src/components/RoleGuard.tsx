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

  // Fail-safe timeout for inner route guards (3s)
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (loading) {
      timer = setTimeout(() => {
        setIsTimeout(true)
      }, 3000)
    }
    return () => clearTimeout(timer)
  }, [loading])

  if (loading) {
    if (isTimeout) {
      // If loading is stuck in a sub-route guard, fallback to dashboard root
      // where the main layout handles general auth state
      return <Navigate to="/dashboard" replace />
    }
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Master Admin bypass: always treat as 'admin' if email matches
  const isMasterAdmin = user?.email === 'allantomazela@gmail.com'

  // Robust Role Determination
  let userRole = user?.role || 'member'
  const userStatus = user?.profile?.status || 'pending'

  if (isMasterAdmin) {
    userRole = 'admin'
  }

  // Status Check - Block access if not approved (even if role is theoretically correct in local state)
  // Master Admin bypasses status check
  if (!isMasterAdmin && userStatus !== 'approved') {
    return <Navigate to="/access-denied" replace />
  }

  // Role Check
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
