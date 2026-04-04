import { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { isMasterAdminEmail } from '@/config/master-admin'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import { Loader2 } from 'lucide-react'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: string[]
  requiredModule?: string // Módulo específico necessário (ex: 'secretariat', 'financial')
}

function RoleGuardInner({
  user,
  allowedRoles,
  requiredModule,
  children,
}: RoleGuardProps & { user: NonNullable<ReturnType<typeof useAuthStore>['user']> }) {
  const { hasPermission, getUserPermissions } = useLodgePositionsStore()

  const isMasterAdmin = isMasterAdminEmail(user?.email)
  let userRole = user?.role || 'member'
  const userStatus = user?.profile?.status
  const isBlockedStatus =
    userStatus === 'blocked' || userStatus === 'in_memoriam'

  if (isMasterAdmin) {
    userRole = 'admin'
  }

  if (!isMasterAdmin && isBlockedStatus) {
    return <Navigate to="/access-denied" replace />
  }

  if (requiredModule && user?.id) {
    if (userRole === 'member' && allowedRoles.includes('member')) {
      // ok
    } else {
      const hasModuleAccess = hasPermission(user.id, requiredModule)
      if (!hasModuleAccess && !isMasterAdmin) {
        return <Navigate to="/access-denied" replace />
      }
    }
  }

  if (user?.id) {
    const userPermissions = getUserPermissions(user.id)
    const hasRoleAccess = allowedRoles.includes(userRole)
    const hasPositionAccess =
      userPermissions.includes('*') ||
      userPermissions.some((perm) => allowedRoles.includes(perm))

    if (isMasterAdmin) {
      return <>{children}</>
    }
    if (!hasRoleAccess && !hasPositionAccess) {
      return <Navigate to="/dashboard" replace />
    }
  } else {
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}

export function RoleGuard({
  children,
  allowedRoles,
  requiredModule,
}: RoleGuardProps) {
  const { user, loading } = useAuthStore()
  const [isTimeout, setIsTimeout] = useState(false)

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
      return <Navigate to="/dashboard" replace />
    }
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <RoleGuardInner user={user} allowedRoles={allowedRoles} requiredModule={requiredModule}>
      {children}
    </RoleGuardInner>
  )
}
