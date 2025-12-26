import { create } from 'zustand'
import { logError } from '@/lib/logger'
import { supabase } from '@/lib/supabase/client'
import { uploadToStorage } from '@/lib/upload-utils'

interface ImageTask {
  id: string
  tableName: string
  columnName: string
  rowId: any
  currentUrl: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

interface ImageOptimizationState {
  tasks: ImageTask[]
  scanning: boolean
  processing: boolean
  progress: number
  scanImages: () => Promise<void>
  processAll: () => Promise<void>
  reset: () => void
}

export const useImageOptimizationStore = create<ImageOptimizationState>(
  (set, get) => ({
    tasks: [],
    scanning: false,
    processing: false,
    progress: 0,

    reset: () =>
      set({ tasks: [], scanning: false, processing: false, progress: 0 }),

    scanImages: async () => {
      set({ scanning: true, tasks: [], progress: 0 })
      const foundTasks: ImageTask[] = []

      try {
        // 1. Scan Profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .not('avatar_url', 'is', null)

        if (profiles) {
          profiles.forEach((p) => {
            if (p.avatar_url)
              foundTasks.push({
                id: `profile-${p.id}`,
                tableName: 'profiles',
                columnName: 'avatar_url',
                rowId: p.id,
                currentUrl: p.avatar_url,
                status: 'pending',
              })
          })
        }

        // 2. Scan News Events
        const { data: news } = await supabase
          .from('news_events')
          .select('id, image_url')
          .not('image_url', 'is', null)

        if (news) {
          news.forEach((n) => {
            if (n.image_url)
              foundTasks.push({
                id: `news-${n.id}`,
                tableName: 'news_events',
                columnName: 'image_url',
                rowId: n.id,
                currentUrl: n.image_url,
                status: 'pending',
              })
          })
        }

        // 3. Scan Venerables
        const { data: venerables } = await supabase
          .from('venerables')
          .select('id, image_url')
          .not('image_url', 'is', null)

        if (venerables) {
          venerables.forEach((v) => {
            if (v.image_url)
              foundTasks.push({
                id: `venerable-${v.id}`,
                tableName: 'venerables',
                columnName: 'image_url',
                rowId: v.id,
                currentUrl: v.image_url,
                status: 'pending',
              })
          })
        }

        // 4. Scan Site Settings
        const { data: settings } = await supabase
          .from('site_settings')
          .select('id, logo_url, favicon_url, history_image_url')
          .eq('id', 1)
          .single()

        if (settings) {
          if (settings.logo_url)
            foundTasks.push({
              id: 'settings-logo',
              tableName: 'site_settings',
              columnName: 'logo_url',
              rowId: 1,
              currentUrl: settings.logo_url,
              status: 'pending',
            })
          if (settings.favicon_url)
            foundTasks.push({
              id: 'settings-favicon',
              tableName: 'site_settings',
              columnName: 'favicon_url',
              rowId: 1,
              currentUrl: settings.favicon_url,
              status: 'pending',
            })
          if (settings.history_image_url)
            foundTasks.push({
              id: 'settings-history',
              tableName: 'site_settings',
              columnName: 'history_image_url',
              rowId: 1,
              currentUrl: settings.history_image_url,
              status: 'pending',
            })
        }

        set({ tasks: foundTasks })
      } catch (error) {
        logError('Scan failed:', error)
      } finally {
        set({ scanning: false })
      }
    },

    processAll: async () => {
      set({ processing: true })
      const { tasks } = get()
      const pendingTasks = tasks.filter((t) => t.status === 'pending')
      let completed = 0

      for (const task of pendingTasks) {
        try {
          // Update status to processing
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === task.id ? { ...t, status: 'processing' } : t,
            ),
          }))

          // 1. Fetch Image
          const response = await fetch(task.currentUrl)
          if (!response.ok) throw new Error('Failed to fetch image')

          const blob = await response.blob()
          // Extract filename from URL or generate one
          const urlParts = task.currentUrl.split('/')
          const filename = urlParts[urlParts.length - 1] || 'image.jpg'
          const file = new File([blob], filename, { type: blob.type })

          // 2. Determine Bucket based on table (simplification)
          // Based on upload-utils buckets: 'site-assets' seems universal in this project
          const bucket = 'site-assets'
          const folder =
            task.tableName === 'profiles'
              ? 'avatars'
              : task.tableName === 'news_events'
                ? 'news'
                : task.tableName === 'venerables'
                  ? 'venerables'
                  : 'uploads'

          // 3. Upload & Optimize
          const newUrl = await uploadToStorage(file, bucket, folder)

          // 4. Update Database
          const { error: updateError } = await supabase
            .from(task.tableName as any)
            .update({ [task.columnName]: newUrl })
            .eq('id', task.rowId)

          if (updateError) throw updateError

          // Success
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === task.id
                ? { ...t, status: 'completed', currentUrl: newUrl }
                : t,
            ),
          }))
        } catch (error: any) {
          logError(`Error processing ${task.id}:`, error)
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === task.id
                ? { ...t, status: 'error', error: error.message }
                : t,
            ),
          }))
        } finally {
          completed++
          set({ progress: (completed / pendingTasks.length) * 100 })
        }
      }

      set({ processing: false })
    },
  }),
)

export default useImageOptimizationStore
