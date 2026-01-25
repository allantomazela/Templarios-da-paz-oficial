import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { devLog, logError } from '@/lib/logger'

export type LodgePositionType =
  | 'veneravel_mestre'
  | 'orador'
  | 'secretario'
  | 'chanceler'
  | 'tesoureiro'
  | 'mestre_banquete'

export interface LodgePosition {
  id: string
  position_type: LodgePositionType
  user_id: string | null
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string
    email: string
  }
}

export interface LodgePositionHistory {
  id: string
  position_type: LodgePositionType
  user_id: string | null
  start_date: string
  end_date: string
  created_at: string
}

// Mapeamento de permissões por cargo
export const POSITION_PERMISSIONS: Record<LodgePositionType, string[]> = {
  veneravel_mestre: ['*'], // Acesso total
  secretario: ['secretariat', 'agenda', 'library'],
  chanceler: ['chancellor', 'agenda'],
  tesoureiro: ['financial'],
  orador: ['reports'], // Apenas visualização de relatórios
  mestre_banquete: ['agenda', 'events', 'agape'],
}

// Labels dos cargos
export const POSITION_LABELS: Record<LodgePositionType, string> = {
  veneravel_mestre: 'Venerável Mestre',
  orador: 'Orador',
  secretario: 'Secretário',
  chanceler: 'Chanceler',
  tesoureiro: 'Tesoureiro',
  mestre_banquete: 'Mestre de Banquete',
}

interface LodgePositionsState {
  positions: LodgePosition[]
  history: LodgePositionHistory[]
  loading: boolean

  fetchPositions: () => Promise<void>
  fetchHistory: () => Promise<void>
  assignPosition: (
    positionType: LodgePositionType,
    userId: string,
    startDate: string,
    endDate: string,
  ) => Promise<{ error: any }>
  removePosition: (positionId: string) => Promise<{ error: any }>
  getUserCurrentPosition: (userId: string) => LodgePositionType | null
  hasPermission: (userId: string, module: string) => boolean
  getUserPermissions: (userId: string) => string[]
}

export const useLodgePositionsStore = create<LodgePositionsState>(
  (set, get) => ({
    positions: [],
    history: [],
    loading: false,

    fetchPositions: async () => {
      set({ loading: true })
      try {
        const { data, error } = await supabase
          .from('lodge_positions')
          .select('*')
          .order('position_type')

        if (error) throw error

        // Buscar informações dos usuários separadamente
        if (data && data.length > 0) {
          const userIds = data
            .map((p) => p.user_id)
            .filter((id): id is string => id !== null)

          if (userIds.length > 0) {
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', userIds)

            if (profilesError) {
              logError('Error fetching profiles', profilesError)
            }

            // Combinar dados
            const positionsWithUsers = data.map((position) => {
              const user = profiles?.find((p) => p.id === position.user_id)
              return {
                ...position,
                user: user || undefined,
              }
            })

            set({ positions: positionsWithUsers || [], loading: false })
            devLog(`LodgePositions: Carregados ${positionsWithUsers?.length || 0} cargos`)
            return
          }
        }

        // Se não há dados ou não há user_ids, apenas definir os dados vazios
        set({ positions: data || [], loading: false })
        devLog(`LodgePositions: Carregados ${data?.length || 0} cargos`)
      } catch (error) {
        logError('Error fetching positions', error)
        set({ loading: false })
      }
    },

    fetchHistory: async () => {
      try {
        const { data, error } = await supabase
          .from('lodge_position_history')
          .select('*')
          .order('start_date', { ascending: false })
          .limit(100)

        if (error) throw error

        set({ history: data || [] })
      } catch (error) {
        logError('Error fetching position history', error)
      }
    },

    assignPosition: async (positionType, userId, startDate, endDate) => {
      set({ loading: true })
      try {
        // Verificar se já existe cargo ativo para este tipo
        const { data: existing } = await supabase
          .from('lodge_positions')
          .select('*')
          .eq('position_type', positionType)
          .single()

        if (existing) {
          // Mover cargo antigo para histórico
          await supabase.from('lodge_position_history').insert({
            position_type: existing.position_type,
            user_id: existing.user_id,
            start_date: existing.start_date,
            end_date: existing.end_date,
          })

          // Deletar cargo antigo
          await supabase.from('lodge_positions').delete().eq('id', existing.id)
        }

        // Criar novo cargo
        const { error } = await supabase.from('lodge_positions').insert({
          position_type: positionType,
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
        })

        if (error) throw error

        await get().fetchPositions()
        set({ loading: false })
        return { error: null }
      } catch (error) {
        logError('Error assigning position', error)
        set({ loading: false })
        return { error }
      }
    },

    removePosition: async (positionId) => {
      set({ loading: true })
      try {
        const { data: position } = await supabase
          .from('lodge_positions')
          .select('*')
          .eq('id', positionId)
          .single()

        if (position) {
          // Mover para histórico
          await supabase.from('lodge_position_history').insert({
            position_type: position.position_type,
            user_id: position.user_id,
            start_date: position.start_date,
            end_date: position.end_date,
          })
        }

        const { error } = await supabase
          .from('lodge_positions')
          .delete()
          .eq('id', positionId)

        if (error) throw error

        await get().fetchPositions()
        set({ loading: false })
        return { error: null }
      } catch (error) {
        logError('Error removing position', error)
        set({ loading: false })
        return { error }
      }
    },

    getUserCurrentPosition: (userId) => {
      const { positions } = get()
      const today = new Date().toISOString().split('T')[0]

      const position = positions.find(
        (p) =>
          p.user_id === userId &&
          p.start_date <= today &&
          p.end_date >= today,
      )

      return position?.position_type || null
    },

    hasPermission: (userId, module) => {
      const position = get().getUserCurrentPosition(userId)
      if (!position) return false

      const permissions = POSITION_PERMISSIONS[position]
      return permissions.includes('*') || permissions.includes(module)
    },

    getUserPermissions: (userId) => {
      const position = get().getUserCurrentPosition(userId)
      if (!position) return []

      const permissions = POSITION_PERMISSIONS[position]
      return permissions.includes('*') ? ['*'] : permissions
    },
  }),
)

export default useLodgePositionsStore

