import { useMemo } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { isMasterAdminEmail } from '@/config/master-admin'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import { isDirectoratePosition } from '@/constants/lodgePositions'

/**
 * Permissões do módulo Ágape:
 * - isAgapeController: Mestre de Banquete (designado), VM e admin — acesso total ao módulo Ágape
 * - canRecordConsumption: controlador + diretoria + editor (lançar consumo dos irmãos)
 * - canRegisterOwnConsumption: irmão comum registra apenas o próprio consumo
 *
 * O cargo Mestre de Banquete não concede outros módulos (secretaria, chancelaria, etc.).
 */
export function useAgapePermissions() {
  const { user } = useAuthStore()
  const { getUserCurrentPosition } = useLodgePositionsStore()

  return useMemo(() => {
    if (!user?.id) {
      return {
        isAgapeController: false,
        canRecordConsumption: false,
        canManageSessions: false,
        canManageMenu: false,
        canViewReports: false,
        canRegisterOwnConsumption: false,
        canViewOwnConsumptions: false,
        currentPosition: null as ReturnType<
          typeof getUserCurrentPosition
        >,
      }
    }

    const isMasterAdmin = isMasterAdminEmail(user.email)
    const currentPosition = getUserCurrentPosition(user.id)

    const isAgapeController =
      isMasterAdmin ||
      user.role === 'admin' ||
      currentPosition === 'mestre_banquete' ||
      currentPosition === 'veneravel_mestre'

    const canRecordConsumption =
      isAgapeController ||
      user.role === 'editor' ||
      isDirectoratePosition(currentPosition)

    return {
      isAgapeController,
      canRecordConsumption,
      canManageSessions: isAgapeController,
      canManageMenu: isAgapeController,
      canViewReports: isAgapeController,
      canRegisterOwnConsumption: true,
      canViewOwnConsumptions: true,
      currentPosition,
    }
  }, [user, getUserCurrentPosition])
}
