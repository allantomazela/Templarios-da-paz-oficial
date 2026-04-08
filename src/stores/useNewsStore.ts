import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { logError } from '@/lib/logger'
import { toErrorMessage, withTimeout } from '@/lib/async-utils'
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

const NEWS_SAVE_TIMEOUT_MS = 20000

export interface NewsEvent {
  id: string
  title: string
  content: string
  imageUrl?: string
  eventDate?: string
  isPublished: boolean
  category: 'news' | 'social'
  createdAt: string
  updatedAt: string
}

interface NewsState {
  news: NewsEvent[]
  loading: boolean
  fetchNews: () => Promise<void>
  fetchPublicNews: () => Promise<void>
  addNews: (
    news: Omit<NewsEvent, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<void>
  updateNews: (
    id: string,
    news: Partial<Omit<NewsEvent, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<void>
  deleteNews: (id: string) => Promise<void>
}

// Map DB row to NewsEvent type
const mapRowToNews = (row: any): NewsEvent => ({
  id: row.id,
  title: row.title,
  content: row.content,
  imageUrl: row.image_url,
  eventDate: row.event_date,
  isPublished: row.is_published,
  category: row.category || 'news',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const newsFetchSeq = createRequestSequence()

export const useNewsStore = create<NewsState>((set) => ({
  news: [],
  loading: false,

  fetchNews: async () => {
    const id = newsFetchSeq.next()
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('news_events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(toErrorMessage(error, 'Falha ao salvar a publicacao.'))
      }

      if (data && newsFetchSeq.isCurrent(id)) {
        set({ news: data.map(mapRowToNews) })
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error fetching news:', error)
    } finally {
      if (newsFetchSeq.isCurrent(id)) {
        set({ loading: false })
      }
    }
  },

  fetchPublicNews: async () => {
    const id = newsFetchSeq.next()
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('news_events')
        .select('*')
        .eq('is_published', true)
        .order('event_date', { ascending: false, nullsFirst: false }) // Prefer event date
        .order('created_at', { ascending: false }) // Fallback to created_at
        .limit(6)

      if (error) throw error

      if (data && newsFetchSeq.isCurrent(id)) {
        set({ news: data.map(mapRowToNews) })
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error fetching public news:', error)
    } finally {
      if (newsFetchSeq.isCurrent(id)) {
        set({ loading: false })
      }
    }
  },

  addNews: async (news) => {
    try {
      const payload = {
        title: news.title,
        content: news.content,
        image_url: news.imageUrl?.trim() || null,
        event_date: news.eventDate?.trim() ? news.eventDate : null,
        is_published: news.isPublished,
        category: news.category,
      }
      const { data, error } = await withTimeout(
        supabase
          .from('news_events')
          .insert(payload)
          .select()
          .single(),
        NEWS_SAVE_TIMEOUT_MS,
        'Salvamento demorou demais. Verifique sua conexao e tente novamente.',
      )

      if (error) throw error

      if (data) {
        set((state) => ({
          news: [mapRowToNews(data), ...state.news],
        }))
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error adding news:', error)
      throw new Error(
        toErrorMessage(error, 'Falha ao salvar a publicacao.'),
      )
    }
  },

  updateNews: async (id, news) => {
    try {
      const updates: any = {
        updated_at: new Date().toISOString(),
      }
      if (news.title !== undefined) updates.title = news.title
      if (news.content !== undefined) updates.content = news.content
      if (news.imageUrl !== undefined)
        updates.image_url = news.imageUrl?.trim() || null
      if (news.eventDate !== undefined)
        updates.event_date = news.eventDate?.trim() ? news.eventDate : null
      if (news.isPublished !== undefined)
        updates.is_published = news.isPublished
      if (news.category !== undefined) updates.category = news.category

      const { data, error } = await withTimeout(
        supabase
          .from('news_events')
          .update(updates)
          .eq('id', id)
          .select()
          .single(),
        NEWS_SAVE_TIMEOUT_MS,
        'Salvamento demorou demais. Verifique sua conexao e tente novamente.',
      )

      if (error) {
        throw new Error(toErrorMessage(error, 'Falha ao atualizar a publicacao.'))
      }

      if (data) {
        set((state) => ({
          news: state.news.map((n) => (n.id === id ? mapRowToNews(data) : n)),
        }))
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error updating news:', error)
      throw new Error(
        toErrorMessage(error, 'Falha ao atualizar a publicacao.'),
      )
    }
  },

  deleteNews: async (id) => {
    try {
      const { error } = await supabase.from('news_events').delete().eq('id', id)

      if (error) throw error

      set((state) => ({
        news: state.news.filter((n) => n.id !== id),
      }))
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error deleting news:', error)
      throw error
    }
  },
}))

export default useNewsStore
