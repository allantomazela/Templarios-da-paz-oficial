import { useMemo } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { isMasterAdminEmail } from '@/config/master-admin'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'

/**
 * Permissões de Vendas do Templo:
 * - Administração (admin/editor)
 * - Tesouraria (financial)
 * - Cargos com módulo temple_sales (hospitaleiro, secretário, etc.)
 */
export function useTempleSalesPermissions() {
  const { user } = useAuthStore()
  const { hasPermission } = useLodgePositionsStore()

  return useMemo(() => {
    if (!user?.id) {
      return {
        canManageTempleSales: false,
        canAccessTempleSalesOnly: false,
      }
    }

    const isMasterAdmin = isMasterAdminEmail(user.email)
    const isAdministration =
      isMasterAdmin || user.role === 'admin' || user.role === 'editor'
    const hasFinancialModule = hasPermission(user.id, 'financial')
    const hasTempleSalesModule = hasPermission(user.id, 'temple_sales')

    const canManageTempleSales =
      isAdministration || hasFinancialModule || hasTempleSalesModule

    const canAccessTempleSalesOnly =
      canManageTempleSales && !isAdministration && !hasFinancialModule

    return {
      canManageTempleSales,
      canAccessTempleSalesOnly,
    }
  }, [user, hasPermission])
}
