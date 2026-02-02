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
  
  // Suppress common browser extension errors
  if (
    errorMessage.includes('A listener indicated an asynchronous response by returning true') ||
    errorMessage.includes('message channel closed before a response was received') ||
    errorSource.includes('chrome-extension://') ||
    errorSource.includes('moz-extension://') ||
    errorSource.includes('safari-extension://') ||
    errorSource.includes('settings:')
  ) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
  
  return true
}, true)

// Also handle unhandled promise rejections from extensions
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || String(event.reason || '')
  
  // Suppress common browser extension promise rejection errors
  if (
    errorMessage.includes('A listener indicated an asynchronous response by returning true') ||
    errorMessage.includes('message channel closed before a response was received')
  ) {
    event.preventDefault()
    return false
  }
  
  return true
})

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
