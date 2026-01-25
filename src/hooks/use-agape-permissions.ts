import { useMemo } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'

/**
 * Hook para verificar permissões do módulo de ágape
 * Retorna se o usuário tem permissão de administração (pode gerenciar sessões, cardápio, etc.)
 */
export function useAgapePermissions() {
  const { user } = useAuthStore()
  const { hasPermission, getUserCurrentPosition } = useLodgePositionsStore()

  const isAgapeAdmin = useMemo(() => {
    if (!user?.id) return false

    // Master Admin sempre tem acesso
    const isMasterAdmin = user.email === 'allantomazela@gmail.com'
    if (isMasterAdmin) return true

    // Admin do sistema sempre tem acesso
    if (user.role === 'admin') return true

    // Verificar se tem cargo que dá acesso ao ágape
    const currentPosition = getUserCurrentPosition(user.id)
    
    // Venerável Mestre tem acesso total
    if (currentPosition === 'veneravel_mestre') return true
    
    // Mestre de Banquete tem acesso de administração
    if (currentPosition === 'mestre_banquete') return true

    // Verificar permissão de módulo (para outros cargos que possam ter acesso)
    if (hasPermission(user.id, 'agape')) return true

    return false
  }, [user, hasPermission, getUserCurrentPosition])

  return {
    isAgapeAdmin,
    canManageSessions: isAgapeAdmin,
    canManageMenu: isAgapeAdmin,
    canViewReports: isAgapeAdmin,
    canAddConsumption: true, // Todos os membros podem adicionar consumos
  }
}
