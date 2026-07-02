import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Share, PlusSquare, MoreVertical } from 'lucide-react'
import { logDebug } from '@/lib/logger'
import {
  dismissPwaPrompt,
  isAndroidDevice,
  isIosDevice,
  isPwaPromptDismissedRecently,
  isStandalonePwa,
} from '@/lib/pwa-utils'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type PromptMode = 'android-native' | 'ios' | 'android-manual'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [mode, setMode] = useState<PromptMode | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalonePwa() || isPwaPromptDismissedRecently()) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setMode('android-native')
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    const fallbackTimer = window.setTimeout(() => {
      if (isPwaPromptDismissedRecently() || isStandalonePwa()) return

      setMode((current) => {
        if (current) return current
        if (isIosDevice()) return 'ios'
        if (isAndroidDevice()) return 'android-manual'
        return null
      })

      setVisible((current) => {
        if (current) return true
        return isIosDevice() || isAndroidDevice()
      })
    }, 4000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.clearTimeout(fallbackTimer)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      logDebug('PWA installation accepted')
    }

    setDeferredPrompt(null)
    setVisible(false)
    setMode(null)
  }

  const handleDismiss = () => {
    setVisible(false)
    setMode(null)
    setDeferredPrompt(null)
    dismissPwaPrompt()
  }

  if (!visible || !mode) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Instalar App</h3>
            <p className="text-sm text-muted-foreground">
              {mode === 'ios'
                ? 'No iPhone/iPad, adicione o app à Tela de Início pelo Safari.'
                : 'Adicione Templários da Paz à tela inicial para acesso rápido.'}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 shrink-0"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {mode === 'ios' && (
          <ol className="text-sm text-muted-foreground space-y-2 list-none pl-0">
            <li className="flex items-start gap-2">
              <Share className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>
                Abra o site no <strong>Safari</strong> e toque em <strong>Compartilhar</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <PlusSquare className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>
                Escolha <strong>Adicionar à Tela de Início</strong> e confirme
              </span>
            </li>
          </ol>
        )}

        {mode === 'android-manual' && (
          <ol className="text-sm text-muted-foreground space-y-2 list-none pl-0">
            <li className="flex items-start gap-2">
              <MoreVertical className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>
                No <strong>Chrome</strong>, toque no menu <strong>⋮</strong> (três pontos)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Download className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>
                Selecione <strong>Instalar app</strong> ou{' '}
                <strong>Adicionar à tela inicial</strong>
              </span>
            </li>
          </ol>
        )}

        {mode === 'android-native' && (
          <Button size="sm" className="w-full" onClick={handleInstall}>
            <Download className="h-4 w-4 mr-2" />
            Instalar agora
          </Button>
        )}

        {mode !== 'android-native' && (
          <Button size="sm" variant="outline" className="w-full" onClick={handleDismiss}>
            Entendi
          </Button>
        )}
      </div>
    </div>
  )
}
