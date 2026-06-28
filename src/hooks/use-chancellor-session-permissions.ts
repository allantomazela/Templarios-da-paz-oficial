import { useMemo } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { isMasterAdminEmail } from '@/config/master-admin'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'

const SESSION_MANAGER_POSITIONS = new Set([
  'chanceler',
  'mestre_banquete',
  'veneravel_mestre',
])

/**
 * Quem pode abrir sessão do dia, gerenciar presença e exibir QR na Chancelaria.
 */
export function useChancellorSessionPermissions() {
  const { user } = useAuthStore()
  const { getUserCurrentPosition } = useLodgePositionsStore()

  return useMemo(() => {
    if (!user?.id) {
      return {
        canManageSessions: false,
        currentPosition: null as ReturnType<typeof getUserCurrentPosition>,
      }
    }

    const isMasterAdmin = isMasterAdminEmail(user.email)
    const currentPosition = getUserCurrentPosition(user.id)
    const canManageSessions =
      isMasterAdmin ||
      user.role === 'admin' ||
      user.role === 'editor' ||
      (currentPosition !== null && SESSION_MANAGER_POSITIONS.has(currentPosition))

    return { canManageSessions, currentPosition }
  }, [user, getUserCurrentPosition])
}
