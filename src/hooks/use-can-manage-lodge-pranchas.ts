import { useMemo } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import { isMasterAdminEmail } from '@/config/master-admin'

/** Venerável Mestre em exercício ou administrador geral do site. */
export function useCanManageLodgePranchas(): boolean {
  const user = useAuthStore((s) => s.user)
  const positions = useLodgePositionsStore((s) => s.positions)

  return useMemo(() => {
    if (isMasterAdminEmail(user?.email)) return true
    if (!user?.id) return false
    const today = new Date().toISOString().slice(0, 10)
    return positions.some(
      (position) =>
        position.position_type === 'veneravel_mestre' &&
        position.user_id === user.id &&
        position.start_date <= today &&
        position.end_date >= today,
    )
  }, [positions, user?.email, user?.id])
}
