/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
import { logDebug, logWarning } from '@/lib/logger'

// Suppress browser extension errors that don't affect our application
// These errors occur when browser extensions try to intercept messages
// but the message channel closes before a response is received
window.addEventListener('error', (event) => {
  const errorMessage = event.message || ''
  const errorSource = event.filename || ''

  // Suppress common browser extension errors (e.g. "media:1", "content.js" = extension script)
  if (
    errorMessage.includes('A listener indicated an asynchronous response by returning true') ||
    errorMessage.includes('message channel closed before a response was received') ||
    errorMessage.includes("Cannot read properties of undefined (reading 'hostname')") ||
    errorSource.includes('chrome-extension://') ||
    errorSource.includes('moz-extension://') ||
    errorSource.includes('safari-extension://') ||
    errorSource.includes('extension://') ||
    errorSource.includes('content.js') ||
    errorSource.includes('settings:') ||
    errorSource === 'media' ||
    /^[a-z]+:\d+$/.test(errorSource) // e.g. "media:1", "ext:1"
  ) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }

  return true
}, true)

// Also handle unhandled promise rejections from extensions (capture phase = run first)
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  const errorMessage =
    (reason && typeof reason === 'object' && 'message' in reason && String((reason as Error).message)) ||
    String(reason ?? '')
  const errorSource =
    reason && typeof reason === 'object' && 'filename' in reason
      ? String((reason as { filename?: string }).filename ?? '')
      : ''

  const isExtensionNoise =
    errorMessage.includes('A listener indicated an asynchronous response by returning true') ||
    errorMessage.includes('message channel closed before a response was received') ||
    errorMessage.includes("Cannot read properties of undefined (reading 'hostname')") ||
    errorSource.includes('extension://') ||
    errorSource.includes('content.js') ||
    errorSource.includes('settings') || // e.g. "settings:1" from extensions
    errorSource === 'media' ||
    /^[a-z]+:\d+$/.test(errorSource) // e.g. "media:1", "ext:1", "settings:1"

  if (isExtensionNoise) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }

  // Chunk load error (404 em asset após novo deploy): recarregar com cache-bust
  const isChunkLoadError =
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    (errorMessage.includes('Loading chunk') && errorMessage.includes('failed'))
  if (isChunkLoadError && typeof sessionStorage !== 'undefined') {
    const key = 'templarios-chunk-reload'
    if (sessionStorage.getItem(key) !== '1') {
      sessionStorage.setItem(key, '1')
      event.preventDefault()
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('_', String(Date.now()))
        window.location.href = url.toString()
      } catch {
        window.location.reload()
      }
      return false
    }
  }
}, true)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        logDebug('Service Worker registered', registration.scope)

        // Check for updates periodically (reduced frequency to avoid errors)
        // Only check if registration is still active
        let updateInterval: NodeJS.Timeout | null = null

        const scheduleUpdate = () => {
          if (updateInterval) {
            clearInterval(updateInterval)
          }

          updateInterval = setInterval(() => {
            if (registration.active) {
              registration.update().catch((err) => {
                // Silently fail - updates are optional
                logWarning('Service Worker update check failed', err)
              })
            } else {
              // Registration is no longer active, stop checking
              if (updateInterval) {
                clearInterval(updateInterval)
                updateInterval = null
              }
            }
          }, 300000) // Check every 5 minutes instead of 1 minute
        }

        scheduleUpdate()

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          logDebug('Service Worker update found')
        })
      })
      .catch((error) => {
        logWarning('Service Worker registration failed', error)
        // Don't throw - PWA is optional
      })
  })
}

createRoot(document.getElementById('root')!).render(<App />)

// Limpar flags de reload após carregamento ok (permite novo reload após próximo deploy)
setTimeout(() => {
  try {
    sessionStorage.removeItem('templarios-chunk-reload')
    sessionStorage.removeItem('templarios-asset-reload')
  } catch {
    // ignore
  }
}, 3000)
