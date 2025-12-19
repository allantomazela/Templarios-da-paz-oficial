import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { Loader2 } from 'lucide-react'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: string[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Check if user has role
  const userRole = user?.role || 'member'

  if (!allowedRoles.includes(userRole)) {
    // If admin tries to access user stuff, usually okay, but here strict.
    // Redirect to dashboard root if unauthorized
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
