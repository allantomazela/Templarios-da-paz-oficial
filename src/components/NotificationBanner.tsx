import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useNotificationStore from '@/stores/useNotificationStore'
import useAuthStore from '@/stores/useAuthStore'

export function NotificationBanner() {
  const { permission, requestPermission, checkPermission } =
    useNotificationStore()
  const { user } = useAuthStore()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  useEffect(() => {
    // Show if permission is default (not asked yet) and user is logged in
    if (user && permission === 'default') {
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
    setIsVisible(false)
  }, [permission, user])

  const handleEnable = async () => {
    if (user) {
      await requestPermission(user.id)
      setIsVisible(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Ideally store dismissal in local storage to not annoy user immediately again
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 right-4 z-50 max-w-md w-full p-4"
        >
          <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex items-start gap-4">
            <div className="p-2 bg-white/20 rounded-full shrink-0">
              <Bell className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm mb-1">Ativar Notificações?</h4>
              <p className="text-xs text-primary-foreground/90 mb-3">
                Receba lembretes de eventos e comunicados importantes da loja
                diretamente no seu dispositivo.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs h-8"
                  onClick={handleEnable}
                >
                  Ativar Agora
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-8 hover:bg-white/20 hover:text-white"
                  onClick={handleDismiss}
                >
                  Agora Não
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-primary-foreground/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
