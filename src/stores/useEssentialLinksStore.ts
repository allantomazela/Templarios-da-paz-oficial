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
  created_at?: string
  updated_at?: string
}

export type EssentialLinkInput = {
  title: string
  url: string
  icon_name: string
  sort_order: number
  is_active: boolean
}

type FetchOptions = {
  includeInactive?: boolean
  /** Ignora cache em memória (após CRUD). */
  force?: boolean
}

interface EssentialLinksState {
  links: EssentialLink[]
  loading: boolean
  fetchLinks: (options?: FetchOptions) => Promise<void>
  addLink: (link: EssentialLinkInput) => Promise<void>
  updateLink: (id: string, link: Partial<EssentialLinkInput>) => Promise<void>
  deleteLink: (id: string) => Promise<void>
}

const fetchLinksSeq = createRequestSequence()
const CACHE_TTL_MS = 90_000
const MEMBER_COLUMNS =
  'id, title, url, icon_name, sort_order, is_active' as const

let cacheFetchedAt = 0
let cacheIncludeInactive: boolean | null = null

function invalidateEssentialLinksCache() {
  cacheFetchedAt = 0
  cacheIncludeInactive = null
}

export const useEssentialLinksStore = create<EssentialLinksState>((set, get) => ({
  links: [],
  loading: false,

  fetchLinks: async (options) => {
    const includeInactive = Boolean(options?.includeInactive)
    const force = Boolean(options?.force)
    const now = Date.now()
    const current = get().links

    if (
      !force &&
      current.length > 0 &&
      cacheIncludeInactive === includeInactive &&
      now - cacheFetchedAt < CACHE_TTL_MS
    ) {
      return
    }

    const id = fetchLinksSeq.next()
    // Evita “flash” de loading quando já há dados em cache
    if (current.length === 0) {
      set({ loading: true })
    }

    try {
      let query = supabase
        .from('essential_links')
        .select(MEMBER_COLUMNS)
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true })

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error

      if (data && fetchLinksSeq.isCurrent(id)) {
        cacheFetchedAt = Date.now()
        cacheIncludeInactive = includeInactive
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
        .select(MEMBER_COLUMNS)
        .single()

      if (error) throw error

      invalidateEssentialLinksCache()

      if (data) {
        set((state) => ({
          links: [...state.links, data as EssentialLink].sort(
            (a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title),
          ),
        }))
        cacheFetchedAt = Date.now()
        cacheIncludeInactive = true
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
        .select(MEMBER_COLUMNS)
        .single()

      if (error) throw error

      invalidateEssentialLinksCache()

      if (data) {
        set((state) => ({
          links: state.links
            .map((item) => (item.id === id ? (data as EssentialLink) : item))
            .sort(
              (a, b) =>
                a.sort_order - b.sort_order || a.title.localeCompare(b.title),
            ),
        }))
        cacheFetchedAt = Date.now()
        cacheIncludeInactive = true
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

      invalidateEssentialLinksCache()

      set((state) => ({
        links: state.links.filter((item) => item.id !== id),
      }))
      cacheFetchedAt = Date.now()
      cacheIncludeInactive = true
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error deleting essential link:', error)
      throw error
    }
  },
}))

export default useEssentialLinksStore
