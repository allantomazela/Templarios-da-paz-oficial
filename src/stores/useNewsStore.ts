import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export interface NewsEvent {
  id: string
  title: string
  content: string
  imageUrl?: string
  eventDate?: string
  isPublished: boolean
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
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const useNewsStore = create<NewsState>((set, get) => ({
  news: [],
  loading: false,

  fetchNews: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('news_events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        set({ news: data.map(mapRowToNews) })
      }
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchPublicNews: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('news_events')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error

      if (data) {
        set({ news: data.map(mapRowToNews) })
      }
    } catch (error) {
      console.error('Error fetching public news:', error)
    } finally {
      set({ loading: false })
    }
  },

  addNews: async (news) => {
    try {
      const { data, error } = await supabase
        .from('news_events')
        .insert({
          title: news.title,
          content: news.content,
          image_url: news.imageUrl,
          event_date: news.eventDate,
          is_published: news.isPublished,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        set((state) => ({
          news: [mapRowToNews(data), ...state.news],
        }))
      }
    } catch (error) {
      console.error('Error adding news:', error)
      throw error
    }
  },

  updateNews: async (id, news) => {
    try {
      const updates: any = {}
      if (news.title !== undefined) updates.title = news.title
      if (news.content !== undefined) updates.content = news.content
      if (news.imageUrl !== undefined) updates.image_url = news.imageUrl
      if (news.eventDate !== undefined) updates.event_date = news.eventDate
      if (news.isPublished !== undefined)
        updates.is_published = news.isPublished
      updates.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('news_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        set((state) => ({
          news: state.news.map((n) => (n.id === id ? mapRowToNews(data) : n)),
        }))
      }
    } catch (error) {
      console.error('Error updating news:', error)
      throw error
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
      console.error('Error deleting news:', error)
      throw error
    }
  },
}))

export default useNewsStore
