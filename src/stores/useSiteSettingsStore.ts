import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export interface Venerable {
  id: string
  name: string
  period: string
  imageUrl?: string
}

export interface SiteSettingsState {
  loading: boolean
  logoUrl: string
  history: {
    title: string
    text: string
    imageUrl: string
  }
  values: {
    liberty: string
    equality: string
    fraternity: string
  }
  contact: {
    address: string
    city: string
    zip: string
    email: string
    secondaryEmail: string
  }
  venerables: Venerable[]
  sectionOrder: string[]
  primaryColor: string
  secondaryColor: string
  fontFamily: string

  fetchSettings: () => Promise<void>
  updateLogo: (url: string) => Promise<void>
  updateHistory: (data: Partial<SiteSettingsState['history']>) => Promise<void>
  updateValues: (data: Partial<SiteSettingsState['values']>) => Promise<void>
  updateContact: (data: Partial<SiteSettingsState['contact']>) => Promise<void>
  updateLayout: (order: string[]) => Promise<void>
  updateTheme: (
    data: Partial<{
      primaryColor: string
      secondaryColor: string
      fontFamily: string
    }>,
  ) => Promise<void>

  fetchVenerables: () => Promise<void>
  addVenerable: (venerable: Omit<Venerable, 'id'>) => Promise<void>
  updateVenerable: (venerable: Venerable) => Promise<void>
  deleteVenerable: (id: string) => Promise<void>
}

// Map database columns to store structure
const mapSettingsFromDB = (data: any) => {
  let order = data.section_order

  // Default order if null
  if (!order) {
    order = ['history', 'values', 'venerables', 'news', 'contact']
  }

  // Ensure 'values' (Pilares) is present in the order
  if (Array.isArray(order) && !order.includes('values')) {
    // Insert 'values' after 'history' if present, otherwise at the beginning
    const historyIndex = order.indexOf('history')
    if (historyIndex !== -1) {
      const newOrder = [...order]
      newOrder.splice(historyIndex + 1, 0, 'values')
      order = newOrder
    } else {
      order = ['values', ...order]
    }
  }

  return {
    logoUrl: data.logo_url || '',
    history: {
      title: data.history_title || '',
      text: data.history_text || '',
      imageUrl: data.history_image_url || '',
    },
    values: {
      liberty: data.values_liberty || '',
      equality: data.values_equality || '',
      fraternity: data.values_fraternity || '',
    },
    contact: {
      address: data.contact_address || '',
      city: data.contact_city || '',
      zip: data.contact_zip || '',
      email: data.contact_email || '',
      secondaryEmail: data.contact_secondary_email || '',
    },
    sectionOrder: order,
    primaryColor: data.primary_color || '#007AFF',
    secondaryColor: data.secondary_color || '#1e293b',
    fontFamily: data.font_family || 'Inter',
  }
}

export const useSiteSettingsStore = create<SiteSettingsState>((set, get) => ({
  loading: false,
  logoUrl: '',
  history: {
    title: '',
    text: '',
    imageUrl: '',
  },
  values: {
    liberty: '',
    equality: '',
    fraternity: '',
  },
  contact: {
    address: '',
    city: '',
    zip: '',
    email: '',
    secondaryEmail: '',
  },
  venerables: [],
  sectionOrder: ['history', 'values', 'venerables', 'news', 'contact'],
  primaryColor: '#007AFF',
  secondaryColor: '#1e293b',
  fontFamily: 'Inter',

  fetchSettings: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (error) {
        if (error.code !== 'PGRST116') {
          throw error
        }
      }

      if (data) {
        set({ ...mapSettingsFromDB(data) })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      set({ loading: false })
    }
  },

  updateLogo: async (url) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ logo_url: url })
        .eq('id', 1)

      if (error) throw error
      set({ logoUrl: url })
    } catch (error) {
      console.error('Error updating logo:', error)
      throw error
    }
  },

  updateHistory: async (data) => {
    try {
      const updates: any = {}
      if (data.title !== undefined) updates.history_title = data.title
      if (data.text !== undefined) updates.history_text = data.text
      if (data.imageUrl !== undefined) updates.history_image_url = data.imageUrl

      const { error } = await supabase
        .from('site_settings')
        .update(updates)
        .eq('id', 1)

      if (error) throw error

      set((state) => ({
        history: { ...state.history, ...data },
      }))
    } catch (error) {
      console.error('Error updating history:', error)
      throw error
    }
  },

  updateValues: async (data) => {
    try {
      const updates: any = {}
      if (data.liberty !== undefined) updates.values_liberty = data.liberty
      if (data.equality !== undefined) updates.values_equality = data.equality
      if (data.fraternity !== undefined)
        updates.values_fraternity = data.fraternity

      const { error } = await supabase
        .from('site_settings')
        .update(updates)
        .eq('id', 1)

      if (error) throw error

      set((state) => ({
        values: { ...state.values, ...data },
      }))
    } catch (error) {
      console.error('Error updating values:', error)
      throw error
    }
  },

  updateContact: async (data) => {
    try {
      const updates: any = {}
      if (data.address !== undefined) updates.contact_address = data.address
      if (data.city !== undefined) updates.contact_city = data.city
      if (data.zip !== undefined) updates.contact_zip = data.zip
      if (data.email !== undefined) updates.contact_email = data.email
      if (data.secondaryEmail !== undefined)
        updates.contact_secondary_email = data.secondaryEmail

      const { error } = await supabase
        .from('site_settings')
        .update(updates)
        .eq('id', 1)

      if (error) throw error

      set((state) => ({
        contact: { ...state.contact, ...data },
      }))
    } catch (error) {
      console.error('Error updating contact:', error)
      throw error
    }
  },

  updateLayout: async (order) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ section_order: order })
        .eq('id', 1)

      if (error) throw error
      set({ sectionOrder: order })
    } catch (error) {
      console.error('Error updating layout:', error)
      throw error
    }
  },

  updateTheme: async (data) => {
    try {
      const updates: any = {}
      if (data.primaryColor) updates.primary_color = data.primaryColor
      if (data.secondaryColor) updates.secondary_color = data.secondaryColor
      if (data.fontFamily) updates.font_family = data.fontFamily

      const { error } = await supabase
        .from('site_settings')
        .update(updates)
        .eq('id', 1)

      if (error) throw error
      set((state) => ({ ...state, ...data }))
    } catch (error) {
      console.error('Error updating theme:', error)
      throw error
    }
  },

  fetchVenerables: async () => {
    try {
      const { data, error } = await supabase
        .from('venerables')
        .select('*')
        .order('period', { ascending: false })

      if (error) throw error

      if (data) {
        const mappedVenerables = data.map((v: any) => ({
          id: v.id,
          name: v.name,
          period: v.period,
          imageUrl: v.image_url,
        }))
        set({ venerables: mappedVenerables })
      }
    } catch (error) {
      console.error('Error fetching venerables:', error)
    }
  },

  addVenerable: async (venerable) => {
    try {
      const { data, error } = await supabase
        .from('venerables')
        .insert({
          name: venerable.name,
          period: venerable.period,
          image_url: venerable.imageUrl,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        const newVenerable: Venerable = {
          id: data.id,
          name: data.name,
          period: data.period,
          imageUrl: data.image_url,
        }
        set((state) => ({
          venerables: [newVenerable, ...state.venerables],
        }))
      }
    } catch (error) {
      console.error('Error adding venerable:', error)
      throw error
    }
  },

  updateVenerable: async (venerable) => {
    try {
      const { error } = await supabase
        .from('venerables')
        .update({
          name: venerable.name,
          period: venerable.period,
          image_url: venerable.imageUrl,
        })
        .eq('id', venerable.id)

      if (error) throw error

      set((state) => ({
        venerables: state.venerables.map((v) =>
          v.id === venerable.id ? venerable : v,
        ),
      }))
    } catch (error) {
      console.error('Error updating venerable:', error)
      throw error
    }
  },

  deleteVenerable: async (id) => {
    try {
      const { error } = await supabase.from('venerables').delete().eq('id', id)

      if (error) throw error

      set((state) => ({
        venerables: state.venerables.filter((v) => v.id !== id),
      }))
    } catch (error) {
      console.error('Error deleting venerable:', error)
      throw error
    }
  },
}))

export default useSiteSettingsStore
