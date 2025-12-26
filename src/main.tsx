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

                // Check for updates periodically
                setInterval(() => {
                    registration.update()
                }, 60000) // Check every minute
            })
            .catch((error) => {
                logWarning('Service Worker registration failed', error)
                // Don't throw - PWA is optional
            })
    })
}

createRoot(document.getElementById('root')!).render(<App />)
