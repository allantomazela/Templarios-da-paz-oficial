/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
import { logDebug, logWarning } from '@/lib/logger'

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
