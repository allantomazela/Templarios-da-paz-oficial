import { create } from 'zustand'
import { logWarning, logError } from '@/lib/logger'
import { isAuthError } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'
import { registerDevicePushSubscription } from '@/lib/push-subscription'

function handleAuthError(error: unknown): boolean {
  if (isAuthError(error)) {
    useAuthStore.getState().clearSessionAndRedirectToLogin()
    return true
  }
  return false
}

interface NotificationState {
  permission: NotificationPermission
  loading: boolean
  isSubscribed: boolean
  checkPermission: () => void
  requestPermission: (profileId: string) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set) => ({
  permission: 'default',
  loading: false,
  isSubscribed: false,

  checkPermission: () => {
    if (!('Notification' in window)) return
    set({ permission: Notification.permission })
    // Check if service worker is ready and we have a subscription
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription()
        set({ isSubscribed: !!subscription })
      })
    }
  },

  requestPermission: async (profileId: string) => {
    if (!('Notification' in window)) {
      logWarning('Notifications not supported')
      return
    }

    set({ loading: true })
    try {
      const permission = await Notification.requestPermission()
      set({ permission })

      if (permission === 'granted') {
        const saved = await registerDevicePushSubscription(profileId)
        set({ isSubscribed: saved })
        if (!saved) {
          logWarning('Push subscription was not stored')
        }
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error requesting notification permission', error)
    } finally {
      set({ loading: false })
    }
  },
}))

export default useNotificationStore
