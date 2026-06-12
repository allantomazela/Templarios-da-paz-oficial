import { useMemo } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { isMasterAdminEmail } from '@/config/master-admin'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import { useAgapePermissions } from '@/hooks/use-agape-permissions'

/**
 * Permissões do Fechamento Ágape (Financeiro):
 * - Administração (admin/editor)
 * - Tesouraria (módulo financial)
 * - Mestre de Banquete e Venerável Mestre (controle do ágape)
 */
export function useAgapeClosingPermissions() {
  const { user } = useAuthStore()
  const { hasPermission } = useLodgePositionsStore()
  const { isAgapeController } = useAgapePermissions()

  return useMemo(() => {
    if (!user?.id) {
      return {
        canManageAgapeClosing: false,
        canAccessFullFinancial: false,
        canAccessAgapeClosingOnly: false,
      }
    }

    const isMasterAdmin = isMasterAdminEmail(user.email)
    const isAdministration =
      isMasterAdmin || user.role === 'admin' || user.role === 'editor'
    const hasFinancialModule = hasPermission(user.id, 'financial')

    const canManageAgapeClosing =
      isAdministration || hasFinancialModule || isAgapeController

    const canAccessFullFinancial = isAdministration || hasFinancialModule

    const canAccessAgapeClosingOnly =
      canManageAgapeClosing && !canAccessFullFinancial

    return {
      canManageAgapeClosing,
      canAccessFullFinancial,
      canAccessAgapeClosingOnly,
    }
  }, [user, hasPermission, isAgapeController])
}
