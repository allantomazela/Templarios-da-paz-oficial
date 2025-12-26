import { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import { Loader2 } from 'lucide-react'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: string[]
  requiredModule?: string // Módulo específico necessário (ex: 'secretariat', 'financial')
}

export function RoleGuard({
  children,
  allowedRoles,
  requiredModule,
}: RoleGuardProps) {
  const { user, loading } = useAuthStore()
  const { hasPermission, getUserPermissions } = useLodgePositionsStore()
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

  // Verificar acesso baseado em cargo (se requiredModule for especificado)
  if (requiredModule && user?.id) {
    const hasModuleAccess = hasPermission(user.id, requiredModule)
    if (!hasModuleAccess && !isMasterAdmin) {
      return <Navigate to="/access-denied" replace />
    }
  }

  // Verificar permissões de cargo
  if (user?.id) {
    const userPermissions = getUserPermissions(user.id)
    const hasRoleAccess = allowedRoles.includes(userRole)
    const hasPositionAccess =
      userPermissions.includes('*') ||
      userPermissions.some((perm) => allowedRoles.includes(perm))

    // Master Admin sempre tem acesso
    if (isMasterAdmin) {
      return <>{children}</>
    }

    // Verificar se tem acesso via role OU via cargo
    if (!hasRoleAccess && !hasPositionAccess) {
      return <Navigate to="/dashboard" replace />
    }
  } else {
    // Se não tem user.id, verificar apenas por role
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}
