import { create } from 'zustand'
import { logError } from '@/lib/logger'
import { supabase } from '@/lib/supabase/client'
import { createRequestSequence } from '@/lib/request-sequence'
import { isAuthError } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'

function handleAuthError(error: unknown): boolean {
  if (isAuthError(error)) {
    useAuthStore.getState().clearSessionAndRedirectToLogin()
    return true
  }
  return false
}

export interface EssentialLink {
  id: string
  title: string
  url: string
  icon_name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type EssentialLinkInput = {
  title: string
  url: string
  icon_name: string
  sort_order: number
  is_active: boolean
}

interface EssentialLinksState {
  links: EssentialLink[]
  loading: boolean
  fetchLinks: (options?: { includeInactive?: boolean }) => Promise<void>
  addLink: (link: EssentialLinkInput) => Promise<void>
  updateLink: (id: string, link: Partial<EssentialLinkInput>) => Promise<void>
  deleteLink: (id: string) => Promise<void>
}

const fetchLinksSeq = createRequestSequence()

export const useEssentialLinksStore = create<EssentialLinksState>((set) => ({
  links: [],
  loading: false,

  fetchLinks: async (options) => {
    const id = fetchLinksSeq.next()
    set({ loading: true })
    try {
      let query = supabase
        .from('essential_links')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true })

      if (!options?.includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error

      if (data && fetchLinksSeq.isCurrent(id)) {
        set({ links: data as EssentialLink[] })
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error fetching essential links:', error)
    } finally {
      if (fetchLinksSeq.isCurrent(id)) {
        set({ loading: false })
      }
    }
  },

  addLink: async (link) => {
    try {
      const { data, error } = await supabase
        .from('essential_links')
        .insert(link)
        .select()
        .single()

      if (error) throw error

      if (data) {
        set((state) => ({
          links: [...state.links, data as EssentialLink].sort(
            (a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title),
          ),
        }))
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error adding essential link:', error)
      throw error
    }
  },

  updateLink: async (id, link) => {
    try {
      const { data, error } = await supabase
        .from('essential_links')
        .update({ ...link, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        set((state) => ({
          links: state.links
            .map((item) => (item.id === id ? (data as EssentialLink) : item))
            .sort(
              (a, b) =>
                a.sort_order - b.sort_order || a.title.localeCompare(b.title),
            ),
        }))
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error updating essential link:', error)
      throw error
    }
  },

  deleteLink: async (id) => {
    try {
      const { error } = await supabase
        .from('essential_links')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        links: state.links.filter((item) => item.id !== id),
      }))
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error deleting essential link:', error)
      throw error
    }
  },
}))

export default useEssentialLinksStore
