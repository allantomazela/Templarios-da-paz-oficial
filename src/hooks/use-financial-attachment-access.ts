import { useMemo } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { isMasterAdminEmail } from '@/config/master-admin'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'

/** Admin ou tesoureiro (módulo financial) — únicos que podem ver/baixar comprovantes. */
export function useFinancialAttachmentAccess() {
  const { user } = useAuthStore()
  const { hasPermission } = useLodgePositionsStore()

  return useMemo(() => {
    if (!user?.id) return false
    if (isMasterAdminEmail(user.email) || user.role === 'admin') return true
    return hasPermission(user.id, 'financial')
  }, [user, hasPermission])
}
