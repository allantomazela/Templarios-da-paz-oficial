import { useMemo } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { isMasterAdminEmail } from '@/config/master-admin'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import { isDirectoratePosition } from '@/constants/lodgePositions'

/** Administrador do sistema ou membro da diretoria com mandato ativo. */
export function useCanApproveUsers() {
  const { user } = useAuthStore()
  const { getUserCurrentPosition } = useLodgePositionsStore()

  return useMemo(() => {
    if (!user?.id) return false
    if (isMasterAdminEmail(user.email)) return true
    if (user.role === 'admin') return true
    const position = getUserCurrentPosition(user.id)
    return isDirectoratePosition(position)
  }, [user, getUserCurrentPosition])
}
