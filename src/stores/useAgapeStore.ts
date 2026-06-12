import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { logError, devLog } from '@/lib/logger'
import { createRequestSequence } from '@/lib/request-sequence'
import { isAuthError } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'

const agapeFetchSeq = {
  sessions: createRequestSequence(),
  menuItems: createRequestSequence(),
  consumptions: createRequestSequence(),
}

function handleAuthError(error: unknown): boolean {
  if (isAuthError(error)) {
    useAuthStore.getState().clearSessionAndRedirectToLogin()
    return true
  }
  return false
}

export interface AgapeSession {
  id: string
  date: string
  description: string | null
  status: 'open' | 'closed' | 'finalized'
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AgapeMenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AgapeConsumption {
  id: string
  session_id: string
  brother_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  total_amount: number
  notes: string | null
  recorded_by: string | null
  created_at: string
  updated_at: string
  menu_item?: AgapeMenuItem
  brother?: {
    id: string
    full_name: string | null
  }
  recorded_by_profile?: {
    id: string
    full_name: string | null
  }
}

interface AgapeState {
  sessions: AgapeSession[]
  menuItems: AgapeMenuItem[]
  consumptions: AgapeConsumption[]
  /** Carregamento inicial/refetch da lista de cardápio */
  menuItemsLoading: boolean
  loading: boolean

  // Sessions
  fetchSessions: () => Promise<void>
  createSession: (session: Omit<AgapeSession, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: any }>
  updateSession: (id: string, updates: Partial<AgapeSession>) => Promise<{ error: any }>
  closeSession: (id: string) => Promise<{ error: any }>
  finalizeSession: (id: string) => Promise<{ error: any }>
  reopenSession: (id: string) => Promise<{ error: any }>
  deleteSession: (id: string) => Promise<{ error: any }>

  // Menu Items
  fetchMenuItems: () => Promise<void>
  createMenuItem: (item: Omit<AgapeMenuItem, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: any }>
  updateMenuItem: (id: string, updates: Partial<AgapeMenuItem>) => Promise<{ error: any }>
  deleteMenuItem: (id: string) => Promise<{ error: any }>

  // Consumptions
  fetchConsumptions: (sessionId?: string) => Promise<void>
  createConsumption: (consumption: Omit<AgapeConsumption, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: any }>
  updateConsumption: (id: string, updates: Partial<AgapeConsumption>) => Promise<{ error: any }>
  deleteConsumption: (id: string) => Promise<{ error: any }>

  // Reports
  getBrotherSessionTotal: (brotherId: string, sessionId: string) => Promise<{ total_items: number; total_amount: number } | null>
  getSessionTotal: (sessionId: string) => Promise<{ total_brothers: number; total_items: number; total_amount: number } | null>

  /** Limpa cache local (após reset no banco ou troca de aba). */
  clearOperationalCache: () => void
}

export const useAgapeStore = create<AgapeState>((set, get) => ({
  sessions: [],
  menuItems: [],
  consumptions: [],
  menuItemsLoading: false,
  loading: false,

  clearOperationalCache: () => {
    set({ sessions: [], menuItems: [], consumptions: [] })
  },

  fetchSessions: async () => {
    const reqId = agapeFetchSeq.sessions.next()
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('agape_sessions')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      if (agapeFetchSeq.sessions.isCurrent(reqId)) {
        set({ sessions: data || [] })
        devLog(`Agape: Carregadas ${data?.length || 0} sessões`)
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error fetching agape sessions', error)
    } finally {
      if (agapeFetchSeq.sessions.isCurrent(reqId)) {
        set({ loading: false })
      }
    }
  },

  createSession: async (session) => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('agape_sessions')
        .insert({
          ...session,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      await get().fetchSessions()
      return { error: null }
    } catch (error) {
      if (handleAuthError(error)) return { error }
      logError('Error creating agape session', error)
      return { error }
    } finally {
      set({ loading: false })
    }
  },

  updateSession: async (id, updates) => {
    set({ loading: true })
    try {
      const { error } = await supabase
        .from('agape_sessions')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await get().fetchSessions()
      return { error: null }
    } catch (error) {
      if (handleAuthError(error)) return { error }
      logError('Error updating agape session', error)
      return { error }
    } finally {
      set({ loading: false })
    }
  },

  closeSession: async (id) => {
    return get().updateSession(id, { status: 'closed' })
  },

  finalizeSession: async (id) => {
    return get().updateSession(id, { status: 'finalized' })
  },

  reopenSession: async (id) => {
    return get().updateSession(id, { status: 'open' })
  },

  deleteSession: async (id) => {
    set({ loading: true })
    try {
      const { error } = await supabase
        .from('agape_sessions')
        .delete()
        .eq('id', id)

      if (error) throw error

      await get().fetchSessions()
      set((state) => ({
        consumptions: state.consumptions.filter((c) => c.session_id !== id),
      }))
      return { error: null }
    } catch (error) {
      if (handleAuthError(error)) return { error }
      logError('Error deleting agape session', error)
      return { error }
    } finally {
      set({ loading: false })
    }
  },

  fetchMenuItems: async () => {
    const reqId = agapeFetchSeq.menuItems.next()
    set({ menuItemsLoading: true })
    try {
      const { data, error } = await supabase
        .from('agape_menu_items')
        .select('*')
        .order('category')
        .order('name')

      if (error) throw error

      if (agapeFetchSeq.menuItems.isCurrent(reqId)) {
        set({ menuItems: data || [] })
        devLog(`Agape: Carregados ${data?.length || 0} itens do cardápio`)
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error fetching menu items', error)
    } finally {
      if (agapeFetchSeq.menuItems.isCurrent(reqId)) {
        set({ menuItemsLoading: false })
      }
    }
  },

  createMenuItem: async (item) => {
    try {
      const { data: createdRow, error } = await supabase
        .from('agape_menu_items')
        .insert(item)
        .select()
        .single()

      if (error) throw error

      if (createdRow) {
        set((state) => ({
          menuItems: [...state.menuItems, createdRow].sort((a, b) => {
            const categoryCompare = a.category.localeCompare(b.category, 'pt-BR')
            if (categoryCompare !== 0) return categoryCompare
            return a.name.localeCompare(b.name, 'pt-BR')
          }),
        }))
      } else {
        await get().fetchMenuItems()
      }
      return { error: null }
    } catch (error) {
      if (handleAuthError(error)) return { error }
      logError('Error creating menu item', error)
      return { error }
    }
  },

  updateMenuItem: async (id, updates) => {
    try {
      const { data: updatedRow, error } = await supabase
        .from('agape_menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (updatedRow) {
        set((state) => ({
          menuItems: state.menuItems
            .map((menuItem) => (menuItem.id === id ? updatedRow : menuItem))
            .sort((a, b) => {
              const categoryCompare = a.category.localeCompare(b.category, 'pt-BR')
              if (categoryCompare !== 0) return categoryCompare
              return a.name.localeCompare(b.name, 'pt-BR')
            }),
        }))
      } else {
        await get().fetchMenuItems()
      }
      return { error: null }
    } catch (error) {
      if (handleAuthError(error)) return { error }
      logError('Error updating menu item', error)
      return { error }
    }
  },

  deleteMenuItem: async (id) => {
    try {
      const { error } = await supabase
        .from('agape_menu_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        menuItems: state.menuItems.filter((menuItem) => menuItem.id !== id),
      }))
      return { error: null }
    } catch (error) {
      if (handleAuthError(error)) return { error }
      logError('Error deleting menu item', error)
      return { error }
    }
  },

  fetchConsumptions: async (sessionId) => {
    const reqId = agapeFetchSeq.consumptions.next()
    set({ loading: true })
    try {
      let query = supabase
        .from('agape_consumptions')
        .select(`
          *,
          menu_item:agape_menu_items(*),
          brother:profiles!agape_consumptions_brother_id_fkey(id, full_name),
          recorded_by_profile:profiles!agape_consumptions_recorded_by_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false })

      if (sessionId) {
        query = query.eq('session_id', sessionId)
      }

      const { data, error } = await query

      if (error) throw error

      if (agapeFetchSeq.consumptions.isCurrent(reqId)) {
        set({ consumptions: data || [] })
        devLog(`Agape: Carregados ${data?.length || 0} consumos`)
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error fetching consumptions', error)
    } finally {
      if (agapeFetchSeq.consumptions.isCurrent(reqId)) {
        set({ loading: false })
      }
    }
  },

  createConsumption: async (consumption) => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const brotherId = consumption.brother_id ?? user.id
      if (!brotherId) {
        return { error: new Error('Selecione o irmão para registrar o consumo.') }
      }

      // Primeiro, tentar inserir diretamente
      const { data: insertData, error: insertError } = await supabase
        .from('agape_consumptions')
        .insert({
          ...consumption,
          brother_id: brotherId,
          recorded_by: user.id,
        })
        .select()
        .single()

      // Se não houver erro, sucesso
      if (!insertError && insertData) {
        await get().fetchConsumptions(consumption.session_id)
        return { data: insertData, error: null }
      }

      // Se o erro for 409 (conflict) ou constraint única, buscar o registro existente e atualizar
      if (
        insertError?.code === '23505' ||
        insertError?.status === 409 ||
        insertError?.message?.includes('unique') ||
        insertError?.message?.includes('duplicate')
      ) {
        // Buscar o registro existente
        const { data: existingData, error: fetchError } = await supabase
          .from('agape_consumptions')
          .select('id, quantity, unit_price, total_amount')
          .eq('session_id', consumption.session_id)
          .eq('brother_id', brotherId)
          .eq('menu_item_id', consumption.menu_item_id)
          .maybeSingle()

        if (fetchError) {
          logError('Error fetching existing consumption', fetchError)
          return { error: fetchError }
        }

        if (existingData) {
          // Atualizar a quantidade (somar)
          const newQuantity = existingData.quantity + consumption.quantity
          const newTotalAmount = existingData.unit_price * newQuantity

          const { data: updateData, error: updateError } = await supabase
            .from('agape_consumptions')
            .update({
              quantity: newQuantity,
              total_amount: newTotalAmount,
              recorded_by: user.id,
            })
            .eq('id', existingData.id)
            .select()
            .single()

          if (updateError) {
            logError('Error updating consumption', updateError)
            return { error: updateError }
          }

          await get().fetchConsumptions(consumption.session_id)
          return { data: updateData, error: null }
        }
      }

      // Se chegou aqui, houve um erro não tratado
      return { error: insertError }
    } catch (error) {
      if (handleAuthError(error)) return { error }
      logError('Error creating consumption', error)
      return { error }
    } finally {
      set({ loading: false })
    }
  },

  updateConsumption: async (id, updates) => {
    set({ loading: true })
    try {
      const { error } = await supabase
        .from('agape_consumptions')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      const consumption = get().consumptions.find(c => c.id === id)
      if (consumption) {
        await get().fetchConsumptions(consumption.session_id)
      }
      return { error: null }
    } catch (error) {
      if (handleAuthError(error)) return { error }
      logError('Error updating consumption', error)
      return { error }
    } finally {
      set({ loading: false })
    }
  },

  deleteConsumption: async (id) => {
    set({ loading: true })
    try {
      const consumption = get().consumptions.find(c => c.id === id)

      const { error } = await supabase
        .from('agape_consumptions')
        .delete()
        .eq('id', id)

      if (error) throw error

      if (consumption) {
        await get().fetchConsumptions(consumption.session_id)
      }
      return { error: null }
    } catch (error) {
      if (handleAuthError(error)) return { error }
      logError('Error deleting consumption', error)
      return { error }
    } finally {
      set({ loading: false })
    }
  },

  getBrotherSessionTotal: async (brotherId, sessionId) => {
    try {
      const { data, error } = await supabase.rpc('get_brother_session_total', {
        p_brother_id: brotherId,
        p_session_id: sessionId,
      })

      if (error) throw error

      return data?.[0] || null
    } catch (error) {
      if (handleAuthError(error)) return null
      logError('Error getting brother session total', error)
      return null
    }
  },

  getSessionTotal: async (sessionId) => {
    try {
      const { data, error } = await supabase.rpc('get_session_total', {
        p_session_id: sessionId,
      })

      if (error) throw error

      return data?.[0] || null
    } catch (error) {
      if (handleAuthError(error)) return null
      logError('Error getting session total', error)
      return null
    }
  },
}))

export default useAgapeStore
