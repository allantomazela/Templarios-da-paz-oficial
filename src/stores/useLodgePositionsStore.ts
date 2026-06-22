import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { todayLocalISODate } from '@/lib/format-utils'
import { devLog, logError } from '@/lib/logger'
import { createRequestSequence } from '@/lib/request-sequence'
import { isAuthError } from '@/lib/auth-utils'
import { withTimeout } from '@/lib/async-utils'
import useAuthStore from '@/stores/useAuthStore'

function handleAuthError(error: unknown): boolean {
  if (isAuthError(error)) {
    useAuthStore.getState().clearSessionAndRedirectToLogin()
    return true
  }
  return false
}
import {
  type LodgePositionType,
  POSITION_PERMISSIONS,
} from '@/constants/lodgePositions'

export type { LodgePositionType }

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

const fetchPositionsSeq = createRequestSequence()
const POSITIONS_FETCH_TIMEOUT_MS = 30_000

let positionsFetchInFlight: Promise<void> | null = null

async function loadLodgePositionsFromDb(): Promise<LodgePosition[]> {
  const { data, error } = await supabase
    .from('lodge_positions')
    .select('*')
    .order('position_type')

  if (error) throw error
  if (!data?.length) return []

  const userIds = data
    .map((p) => p.user_id)
    .filter((id): id is string => id !== null)

  if (userIds.length === 0) return data

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds)

  if (profilesError) {
    logError('Error fetching profiles for lodge positions', profilesError)
    return data
  }

  return data.map((position) => {
    const user = profiles?.find((p) => p.id === position.user_id)
    return {
      ...position,
      user: user || undefined,
    }
  })
}

interface LodgePositionsState {
  positions: LodgePosition[]
  history: LodgePositionHistory[]
  loading: boolean
  /** true após a primeira tentativa de fetchPositions (sucesso ou falha) */
  initialized: boolean

  fetchPositions: (options?: { force?: boolean }) => Promise<void>
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
    initialized: false,

    fetchPositions: async (options) => {
      if (positionsFetchInFlight && !options?.force) {
        return positionsFetchInFlight
      }

      const id = fetchPositionsSeq.next()
      set({ loading: true })

      positionsFetchInFlight = (async () => {
        try {
          const positions = await withTimeout(
            loadLodgePositionsFromDb(),
            POSITIONS_FETCH_TIMEOUT_MS,
            'Carregamento dos cargos demorou demais. Verifique sua conexão.',
          )

          if (!fetchPositionsSeq.isCurrent(id)) return
          set({ positions })
          devLog(`LodgePositions: Carregados ${positions.length} cargos`)
        } catch (error) {
          if (handleAuthError(error)) return
          const cached = get().positions
          if (cached.length > 0) {
            devLog('LodgePositions: mantendo cache após falha no recarregamento', error)
          } else {
            logError('Error fetching positions', error)
          }
        } finally {
          positionsFetchInFlight = null
          if (fetchPositionsSeq.isCurrent(id)) {
            set({ loading: false, initialized: true })
          }
        }
      })()

      return positionsFetchInFlight
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
        if (handleAuthError(error)) return
        logError('Error fetching position history', error)
      }
    },

    assignPosition: async (positionType, userId, startDate, endDate) => {
      set({ loading: true })
      try {
        // maybeSingle evita 406 quando ainda não há registro deste cargo
        const { data: existing, error: existingError } = await supabase
          .from('lodge_positions')
          .select('*')
          .eq('position_type', positionType)
          .maybeSingle()

        if (existingError) throw existingError

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

        await get().fetchPositions({ force: true })
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
        const { data: position, error: positionError } = await supabase
          .from('lodge_positions')
          .select('*')
          .eq('id', positionId)
          .maybeSingle()

        if (positionError) throw positionError

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

        await get().fetchPositions({ force: true })
        set({ loading: false })
        return { error: null }
      } catch (error) {
        if (handleAuthError(error)) {
          set({ loading: false })
          return { error }
        }
        logError('Error removing position', error)
        set({ loading: false })
        return { error }
      }
    },

    getUserCurrentPosition: (userId) => {
      const { positions } = get()
      const today = todayLocalISODate()

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

