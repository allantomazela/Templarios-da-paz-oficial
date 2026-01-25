import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { logError, devLog } from '@/lib/logger'

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
  created_at: string
  updated_at: string
  menu_item?: AgapeMenuItem
  brother?: {
    id: string
    full_name: string | null
  }
}

interface AgapeState {
  sessions: AgapeSession[]
  menuItems: AgapeMenuItem[]
  consumptions: AgapeConsumption[]
  loading: boolean

  // Sessions
  fetchSessions: () => Promise<void>
  createSession: (session: Omit<AgapeSession, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: any }>
  updateSession: (id: string, updates: Partial<AgapeSession>) => Promise<{ error: any }>
  closeSession: (id: string) => Promise<{ error: any }>
  finalizeSession: (id: string) => Promise<{ error: any }>

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
}

export const useAgapeStore = create<AgapeState>((set, get) => ({
  sessions: [],
  menuItems: [],
  consumptions: [],
  loading: false,

  fetchSessions: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('agape_sessions')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      set({ sessions: data || [], loading: false })
      devLog(`Agape: Carregadas ${data?.length || 0} sessões`)
    } catch (error) {
      logError('Error fetching agape sessions', error)
      set({ loading: false })
    }
  },

  createSession: async (session) => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('agape_sessions')
        .insert({
          ...session,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      await get().fetchSessions()
      set({ loading: false })
      return { error: null }
    } catch (error) {
      logError('Error creating agape session', error)
      set({ loading: false })
      return { error }
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
      set({ loading: false })
      return { error: null }
    } catch (error) {
      logError('Error updating agape session', error)
      set({ loading: false })
      return { error }
    }
  },

  closeSession: async (id) => {
    return get().updateSession(id, { status: 'closed' })
  },

  finalizeSession: async (id) => {
    return get().updateSession(id, { status: 'finalized' })
  },

  fetchMenuItems: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('agape_menu_items')
        .select('*')
        .order('category')
        .order('name')

      if (error) throw error

      set({ menuItems: data || [], loading: false })
      devLog(`Agape: Carregados ${data?.length || 0} itens do cardápio`)
    } catch (error) {
      logError('Error fetching menu items', error)
      set({ loading: false })
    }
  },

  createMenuItem: async (item) => {
    set({ loading: true })
    try {
      const { error } = await supabase
        .from('agape_menu_items')
        .insert(item)
        .select()
        .single()

      if (error) throw error

      await get().fetchMenuItems()
      set({ loading: false })
      return { error: null }
    } catch (error) {
      logError('Error creating menu item', error)
      set({ loading: false })
      return { error }
    }
  },

  updateMenuItem: async (id, updates) => {
    set({ loading: true })
    try {
      const { error } = await supabase
        .from('agape_menu_items')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await get().fetchMenuItems()
      set({ loading: false })
      return { error: null }
    } catch (error) {
      logError('Error updating menu item', error)
      set({ loading: false })
      return { error }
    }
  },

  deleteMenuItem: async (id) => {
    set({ loading: true })
    try {
      const { error } = await supabase
        .from('agape_menu_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      await get().fetchMenuItems()
      set({ loading: false })
      return { error: null }
    } catch (error) {
      logError('Error deleting menu item', error)
      set({ loading: false })
      return { error }
    }
  },

  fetchConsumptions: async (sessionId) => {
    set({ loading: true })
    try {
      let query = supabase
        .from('agape_consumptions')
        .select(`
          *,
          menu_item:agape_menu_items(*),
          brother:profiles!agape_consumptions_brother_id_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false })

      if (sessionId) {
        query = query.eq('session_id', sessionId)
      }

      const { data, error } = await query

      if (error) throw error

      set({ consumptions: data || [], loading: false })
      devLog(`Agape: Carregados ${data?.length || 0} consumos`)
    } catch (error) {
      logError('Error fetching consumptions', error)
      set({ loading: false })
    }
  },

  createConsumption: async (consumption) => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const brotherId = consumption.brother_id || user.id

      // Primeiro, tentar inserir diretamente
      const { data: insertData, error: insertError } = await supabase
        .from('agape_consumptions')
        .insert({
          ...consumption,
          brother_id: brotherId,
        })
        .select()
        .single()

      // Se não houver erro, sucesso
      if (!insertError && insertData) {
        await get().fetchConsumptions(consumption.session_id)
        set({ loading: false })
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
          set({ loading: false })
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
            })
            .eq('id', existingData.id)
            .select()
            .single()

          if (updateError) {
            logError('Error updating consumption', updateError)
            set({ loading: false })
            return { error: updateError }
          }

          await get().fetchConsumptions(consumption.session_id)
          set({ loading: false })
          return { data: updateData, error: null }
        }
      }

      // Se chegou aqui, houve um erro não tratado
      set({ loading: false })
      return { error: insertError }
    } catch (error) {
      logError('Error creating consumption', error)
      set({ loading: false })
      return { error }
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
      set({ loading: false })
      return { error: null }
    } catch (error) {
      logError('Error updating consumption', error)
      set({ loading: false })
      return { error }
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
      set({ loading: false })
      return { error: null }
    } catch (error) {
      logError('Error deleting consumption', error)
      set({ loading: false })
      return { error }
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
      logError('Error getting session total', error)
      return null
    }
  },
}))

export default useAgapeStore
