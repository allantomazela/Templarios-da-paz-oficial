import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { logError } from '@/lib/logger'

export interface Venerable {
  id: string
  name: string
  period: string
  imageUrl?: string
}

export interface CustomSection {
  id: string
  title: string
  content: string
  type: 'text' | 'text-image' | 'image-text' | 'full-width'
  imageUrl?: string
  backgroundColor?: string
  textColor?: string
  visible: boolean
  order: number
}

export interface SiteSettingsState {
  loading: boolean
  logoUrl: string
  faviconUrl: string
  siteTitle: string
  metaDescription: string
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
  customSections: CustomSection[]
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  typography: {
    letterSpacing: string
    lineHeight: string
    fontWeightBase: string
    fontWeightBold: string
    fontSizeBase: string
    textColor: string
    textColorMuted: string
    textTransform: string
    textDecoration: string
  }

  fetchSettings: () => Promise<void>
  updateLogo: (url: string) => Promise<void>
  updateFavicon: (url: string) => Promise<void>
  updateSeo: (data: { title: string; description: string }) => Promise<void>
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
  updateTypography: (
    data: Partial<SiteSettingsState['typography']>,
  ) => Promise<void>

  fetchVenerables: () => Promise<void>
  addVenerable: (venerable: Omit<Venerable, 'id'>) => Promise<void>
  updateVenerable: (venerable: Venerable) => Promise<void>
  deleteVenerable: (id: string) => Promise<void>

  // Custom Sections
  addCustomSection: (section: Omit<CustomSection, 'id'>) => Promise<void>
  updateCustomSection: (section: CustomSection) => Promise<void>
  deleteCustomSection: (id: string) => Promise<void>
  reorderCustomSections: (sections: CustomSection[]) => Promise<void>
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
    faviconUrl: data.favicon_url || '',
    siteTitle: data.site_title || 'Templários da Paz',
    metaDescription:
      data.meta_description || 'Loja Maçônica Templários da Paz - Botucatu/SP',
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
    customSections: Array.isArray(data.custom_sections)
      ? data.custom_sections.map((s: any) => ({
          id: s.id || crypto.randomUUID(),
          title: s.title || '',
          content: s.content || '',
          type: s.type || 'text',
          imageUrl: s.imageUrl || s.image_url || undefined,
          backgroundColor: s.backgroundColor || s.background_color || undefined,
          textColor: s.textColor || s.text_color || undefined,
          visible: s.visible !== undefined ? s.visible : true,
          order: s.order || 0,
        }))
      : [],
    primaryColor: data.primary_color || '#007AFF',
    secondaryColor: data.secondary_color || '#1e293b',
    fontFamily: data.font_family || 'Inter',
    typography: {
      letterSpacing: data.typography_letter_spacing || '0.01em',
      lineHeight: data.typography_line_height || '1.75',
      fontWeightBase: data.typography_font_weight_base || '400',
      fontWeightBold: data.typography_font_weight_bold || '700',
      fontSizeBase: data.typography_font_size_base || '16px',
      textColor: data.typography_text_color || '#ffffff',
      textColorMuted: data.typography_text_color_muted || '#94a3b8',
      textTransform: data.typography_text_transform || 'none',
      textDecoration: data.typography_text_decoration || 'none',
    },
  }
}

export const useSiteSettingsStore = create<SiteSettingsState>((set, get) => ({
  loading: false,
  logoUrl: '',
  faviconUrl: '',
  siteTitle: '',
  metaDescription: 'Loja Maçônica Templários da Paz - Botucatu/SP',
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
  customSections: [],
  primaryColor: '#007AFF',
  secondaryColor: '#1e293b',
  fontFamily: 'Inter',
  typography: {
    letterSpacing: '0.01em',
    lineHeight: '1.75',
    fontWeightBase: '400',
    fontWeightBold: '700',
    fontSizeBase: '16px',
    textColor: '#ffffff',
    textColorMuted: '#94a3b8',
    textTransform: 'none',
    textDecoration: 'none',
  },

  fetchSettings: async (force = false) => {
    const state = get()
    // Se já temos dados carregados e não é forçado, não precisa buscar novamente
    // Verificamos se temos pelo menos um dado carregado (logo, favicon, ou siteTitle preenchido)
    if (
      !force &&
      (state.logoUrl ||
        state.faviconUrl ||
        (state.siteTitle && state.siteTitle !== ''))
    ) {
      return
    }

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
        set({ ...mapSettingsFromDB(data), loading: false })
      } else {
        set({ loading: false })
      }
    } catch (error) {
      logError('Error fetching settings', error)
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
      logError('Error updating logo', error)
      throw error
    }
  },

  updateFavicon: async (url) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ favicon_url: url })
        .eq('id', 1)

      if (error) throw error
      set({ faviconUrl: url })
    } catch (error) {
      logError('Error updating favicon', error)
      throw error
    }
  },

  updateSeo: async (data) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          site_title: data.title,
          meta_description: data.description,
        })
        .eq('id', 1)

      if (error) throw error
      set({ siteTitle: data.title, metaDescription: data.description })
    } catch (error) {
      logError('Error updating SEO', error)
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
      logError('Error updating history', error)
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
      logError('Error updating values', error)
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
      logError('Error updating contact', error)
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
      logError('Error updating layout', error)
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
      logError('Error updating theme', error)
      throw error
    }
  },

  updateTypography: async (data) => {
    try {
      const updates: any = {}
      if (data.letterSpacing !== undefined)
        updates.typography_letter_spacing = data.letterSpacing
      if (data.lineHeight !== undefined)
        updates.typography_line_height = data.lineHeight
      if (data.fontWeightBase !== undefined)
        updates.typography_font_weight_base = data.fontWeightBase
      if (data.fontWeightBold !== undefined)
        updates.typography_font_weight_bold = data.fontWeightBold
      if (data.fontSizeBase !== undefined)
        updates.typography_font_size_base = data.fontSizeBase
      if (data.textColor !== undefined)
        updates.typography_text_color = data.textColor
      if (data.textColorMuted !== undefined)
        updates.typography_text_color_muted = data.textColorMuted
      if (data.textTransform !== undefined)
        updates.typography_text_transform = data.textTransform
      if (data.textDecoration !== undefined)
        updates.typography_text_decoration = data.textDecoration

      const { error } = await supabase
        .from('site_settings')
        .update(updates)
        .eq('id', 1)

      if (error) throw error

      set((state) => ({
        typography: { ...state.typography, ...data },
      }))
    } catch (error) {
      logError('Error updating typography', error)
      throw error
    }
  },

  fetchVenerables: async (force = false) => {
    const state = get()
    // Se já temos veneráveis carregados e não é forçado, não precisa buscar novamente
    if (!force && state.venerables.length > 0) {
      return
    }

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
      logError('Error fetching venerables', error)
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
      logError('Error adding venerable', error)
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
      logError('Error updating venerable', error)
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
      logError('Error deleting venerable', error)
      throw error
    }
  },

  // Custom Sections Management
  addCustomSection: async (section) => {
    try {
      const state = get()
      const newSection: CustomSection = {
        ...section,
        id: crypto.randomUUID(),
      }

      const updatedSections = [...state.customSections, newSection]

      const { error } = await supabase
        .from('site_settings')
        .update({ custom_sections: updatedSections })
        .eq('id', 1)

      if (error) throw error

      set({ customSections: updatedSections })
    } catch (error) {
      logError('Error adding custom section', error)
      throw error
    }
  },

  updateCustomSection: async (section) => {
    try {
      const state = get()
      const updatedSections = state.customSections.map((s) =>
        s.id === section.id ? section : s,
      )

      const { error } = await supabase
        .from('site_settings')
        .update({ custom_sections: updatedSections })
        .eq('id', 1)

      if (error) throw error

      set({ customSections: updatedSections })
    } catch (error) {
      logError('Error updating custom section', error)
      throw error
    }
  },

  deleteCustomSection: async (id) => {
    try {
      const state = get()
      const updatedSections = state.customSections.filter((s) => s.id !== id)

      const { error } = await supabase
        .from('site_settings')
        .update({ custom_sections: updatedSections })
        .eq('id', 1)

      if (error) throw error

      set({ customSections: updatedSections })
    } catch (error) {
      logError('Error deleting custom section', error)
      throw error
    }
  },

  reorderCustomSections: async (sections) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ custom_sections: sections })
        .eq('id', 1)

      if (error) throw error

      set({ customSections: sections })
    } catch (error) {
      logError('Error reordering custom sections', error)
      throw error
    }
  },
}))

export default useSiteSettingsStore
