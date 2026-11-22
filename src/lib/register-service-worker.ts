import { logDebug, logWarning } from '@/lib/logger'

const RELOAD_GUARD_KEY = 'templarios-sw-reload'
const UPDATE_INTERVAL_MS = 60_000

/**
 * Registra o Service Worker e força a aplicação a pegar builds novos:
 * - update imediato + a cada 60s (e ao voltar para a aba)
 * - ativa SW em waiting e recarrega uma vez quando o controller troca
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return

  // Libera o guard após o carregamento para permitir outro reload no próximo deploy.
  if (typeof sessionStorage !== 'undefined') {
    window.setTimeout(() => {
      sessionStorage.removeItem(RELOAD_GUARD_KEY)
    }, 2500)
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        logDebug('Service Worker registered', registration.scope)
        setupUpdateChecks(registration)
        setupWaitingWorker(registration)
      })
      .catch((error) => {
        logWarning('Service Worker registration failed', error)
      })
  })

  // Só recarrega quando um SW *novo* assume o controle (não na 1ª instalação).
  const hadControllerAtStart = Boolean(navigator.serviceWorker.controller)
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadControllerAtStart || refreshing) return
    if (typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem(RELOAD_GUARD_KEY) === '1') return
      sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
    }
    refreshing = true
    window.location.reload()
  })
}

function setupUpdateChecks(registration: ServiceWorkerRegistration): void {
  const check = () => {
    if (!registration.active && !registration.installing && !registration.waiting) {
      return
    }
    registration.update().catch(() => {})
  }

  check()

  let intervalId: number | null = window.setInterval(check, UPDATE_INTERVAL_MS)

  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      check()
      if (intervalId == null) {
        intervalId = window.setInterval(check, UPDATE_INTERVAL_MS)
      }
    } else if (intervalId != null) {
      window.clearInterval(intervalId)
      intervalId = null
    }
  }

  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', check)
  window.addEventListener('online', check)
  window.addEventListener('pageshow', check)
}

function setupWaitingWorker(registration: ServiceWorkerRegistration): void {
  const promote = (worker: ServiceWorker | null) => {
    if (!worker) return
    worker.postMessage({ type: 'SKIP_WAITING' })
  }

  if (registration.waiting) {
    promote(registration.waiting)
  }

  registration.addEventListener('updatefound', () => {
    const worker = registration.installing
    if (!worker) return
    logDebug('Service Worker update found')
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        promote(worker)
      }
    })
  })
}
