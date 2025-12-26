import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { Profile } from './useAuthStore'
import { logError } from '@/lib/logger'

export interface Minute {
  id: string
  title: string
  content: string
  date: string
  created_at: string
  updated_at: string
  signatures?: MinuteSignature[]
}

export interface MinuteSignature {
  id: string
  minute_id: string
  profile_id: string
  signed_at: string
  profile?: Profile
}

interface MinutesState {
  minutes: Minute[]
  currentMinute: Minute | null
  loading: boolean
  fetchMinutes: () => Promise<void>
  fetchMinuteDetails: (id: string) => Promise<void>
  createMinute: (
    data: Omit<Minute, 'id' | 'created_at' | 'updated_at' | 'signatures'>,
  ) => Promise<void>
  updateMinute: (id: string, data: Partial<Minute>) => Promise<void>
  deleteMinute: (id: string) => Promise<void>
  signMinute: (minuteId: string, profileId: string) => Promise<void>
}

export const useMinutesStore = create<MinutesState>((set) => ({
  minutes: [],
  currentMinute: null,
  loading: false,

  fetchMinutes: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('minutes')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      set({ minutes: data as Minute[] })
    } catch (error) {
      logError('Error fetching minutes:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchMinuteDetails: async (id) => {
    set({ loading: true })
    try {
      // Fetch minute details
      const { data: minuteData, error: minuteError } = await supabase
        .from('minutes')
        .select('*')
        .eq('id', id)
        .single()

      if (minuteError) throw minuteError

      // Fetch signatures with profile info
      const { data: sigData, error: sigError } = await supabase
        .from('minutes_signatures')
        .select('*, profile:profiles(*)')
        .eq('minute_id', id)
        .order('signed_at', { ascending: true })

      if (sigError) throw sigError

      const fullMinute = {
        ...minuteData,
        signatures: sigData as any,
      } as Minute

      set({ currentMinute: fullMinute })
    } catch (error) {
      logError('Error fetching minute details:', error)
    } finally {
      set({ loading: false })
    }
  },

  createMinute: async (minuteData) => {
    try {
      const { data, error } = await supabase
        .from('minutes')
        .insert(minuteData)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        minutes: [data as Minute, ...state.minutes],
      }))
    } catch (error) {
      logError('Error creating minute:', error)
      throw error
    }
  },

  updateMinute: async (id, minuteData) => {
    try {
      const { data, error } = await supabase
        .from('minutes')
        .update({ ...minuteData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        minutes: state.minutes.map((m) => (m.id === id ? (data as Minute) : m)),
        currentMinute:
          state.currentMinute?.id === id
            ? { ...state.currentMinute, ...data }
            : state.currentMinute,
      }))
    } catch (error) {
      logError('Error updating minute:', error)
      throw error
    }
  },

  deleteMinute: async (id) => {
    try {
      const { error } = await supabase.from('minutes').delete().eq('id', id)
      if (error) throw error

      set((state) => ({
        minutes: state.minutes.filter((m) => m.id !== id),
        currentMinute:
          state.currentMinute?.id === id ? null : state.currentMinute,
      }))
    } catch (error) {
      logError('Error deleting minute:', error)
      throw error
    }
  },

  signMinute: async (minuteId, profileId) => {
    try {
      const { data, error } = await supabase
        .from('minutes_signatures')
        .insert({
          minute_id: minuteId,
          profile_id: profileId,
        })
        .select('*, profile:profiles(*)')
        .single()

      if (error) throw error

      set((state) => {
        if (!state.currentMinute || state.currentMinute.id !== minuteId)
          return state

        return {
          currentMinute: {
            ...state.currentMinute,
            signatures: [
              ...(state.currentMinute.signatures || []),
              data as any,
            ],
          },
        }
      })
    } catch (error) {
      logError('Error signing minute:', error)
      throw error
    }
  },
}))

export default useMinutesStore
