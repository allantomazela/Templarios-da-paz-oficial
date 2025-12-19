import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export interface MediaFile {
  id: string
  name: string
  url: string
  size: number
  type: string
  created_at: string
  bucket_id: string
}

interface MediaState {
  files: MediaFile[]
  loading: boolean
  fetchFiles: () => Promise<void>
  deleteFile: (fileName: string) => Promise<void>
}

export const useMediaStore = create<MediaState>((set, get) => ({
  files: [],
  loading: false,

  fetchFiles: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.storage
        .from('site-assets')
        .list('uploads', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        })

      if (error) throw error

      if (data) {
        const files = await Promise.all(
          data.map(async (file) => {
            const { data: urlData } = supabase.storage
              .from('site-assets')
              .getPublicUrl(`uploads/${file.name}`)

            return {
              id: file.id,
              name: file.name,
              url: urlData.publicUrl,
              size: file.metadata?.size || 0,
              type: file.metadata?.mimetype || 'application/octet-stream',
              created_at: file.created_at,
              bucket_id: 'site-assets',
            }
          }),
        )
        set({ files: files as MediaFile[] })
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      set({ loading: false })
    }
  },

  deleteFile: async (fileName) => {
    try {
      const { error } = await supabase.storage
        .from('site-assets')
        .remove([`uploads/${fileName}`])

      if (error) throw error

      set((state) => ({
        files: state.files.filter((f) => f.name !== fileName),
      }))
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  },
}))

export default useMediaStore
