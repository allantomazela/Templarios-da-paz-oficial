// Simple Service Worker for offline capabilities
const CACHE_NAME = 'templarios-cache-v5'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico'
]

// Helper function to check if request should be ignored (Vite HMR, etc.)
function shouldIgnoreRequest(url) {
  const urlStr = url.toString()
  
  // Ignore WebSocket connections
  if (urlStr.startsWith('ws://') || urlStr.startsWith('wss://')) {
    return true
  }
  
  // Ignore Vite HMR requests
  if (urlStr.includes('@vite/client') || 
      urlStr.includes('/@vite/') ||
      urlStr.includes('__vite') ||
      urlStr.includes('?import=') ||
      urlStr.includes('&import=') ||
      urlStr.includes('/node_modules/') ||
      urlStr.includes('/src/')) {
    return true
  }
  
  // During development, ignore all JavaScript/TypeScript module requests
  // to avoid MIME type issues when server restarts
  if (urlStr.includes('localhost') || urlStr.includes('127.0.0.1')) {
    // Ignore JS/TS module files during development
    if (urlStr.endsWith('.js') || 
        urlStr.endsWith('.mjs') || 
        urlStr.endsWith('.ts') || 
        urlStr.endsWith('.tsx') ||
        urlStr.includes('.js?') ||
        urlStr.includes('.ts?') ||
        urlStr.includes('.tsx?')) {
      return true
    }
  }
  
  return false
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Check if CacheStorage is available
        if (!('caches' in self)) {
          console.warn('CacheStorage not available')
          return
        }

        const cache = await caches.open(CACHE_NAME).catch((err) => {
          console.warn('Failed to open cache:', err)
          // Try to delete corrupted cache and recreate
          return caches.delete(CACHE_NAME).then(() => {
            return caches.open(CACHE_NAME)
          }).catch(() => {
            console.error('Failed to recreate cache')
            return null
          })
        })

        if (!cache) {
          console.warn('Cache not available, skipping cache population')
          return
        }

        // Try to add all URLs, but don't fail if some are missing
        await Promise.allSettled(
          urlsToCache.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`Failed to cache ${url}:`, err)
              return null
            })
          )
        )
      } catch (error) {
        console.error('Service Worker install error:', error)
        // Don't fail installation if caching fails
      }
    })()
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        if (!('caches' in self)) {
          return
        }

        const cacheNames = await caches.keys().catch((err) => {
          console.warn('Failed to get cache names:', err)
          return []
        })

        await Promise.allSettled(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName).catch((err) => {
                console.warn(`Failed to delete cache ${cacheName}:`, err)
                return null
              })
            }
            return Promise.resolve()
          })
        )

        await self.clients.claim().catch((err) => {
          console.warn('Failed to claim clients:', err)
        })
      } catch (error) {
        console.error('Service Worker activate error:', error)
      }
    })()
  )
})

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // During development, don't intercept most requests to avoid issues
  const urlStr = event.request.url
  const isDevelopment = urlStr.includes('localhost') || urlStr.includes('127.0.0.1')
  
  // Ignore Vite HMR and development server requests
  if (shouldIgnoreRequest(event.request.url)) {
    // Let the request pass through to the network without interception
    return
  }
  
  // During development, only intercept very specific static files
  if (isDevelopment) {
    // Only intercept requests for index.html, manifest, and favicon
    const isAllowedStatic = urlStr.endsWith('/index.html') || 
                           urlStr.endsWith('/manifest.webmanifest') || 
                           urlStr.endsWith('/favicon.ico') ||
                           (urlStr.endsWith('/') && !urlStr.includes('?'))
    if (!isAllowedStatic) {
      // Let all other requests pass through during development
      return
    }
  }

  event.respondWith(
    (async () => {
      try {
        if (!('caches' in self)) {
          // If CacheStorage is not available, just fetch from network
          return fetch(event.request)
        }

        // Try to get from cache first
        const cachedResponse = await caches.match(event.request).catch((err) => {
          console.warn('Cache match failed:', err)
          return null
        })

        if (cachedResponse) {
          return cachedResponse
        }

        // Cache miss - fetch from network
        try {
          return await fetch(event.request)
        } catch (err) {
          // During development, if fetch fails, don't intercept - let browser handle it
          if (event.request.url.includes('localhost') || event.request.url.includes('127.0.0.1')) {
            // Re-throw to let browser handle the error naturally
            throw err
          }
          
          // For production, try to return offline page if available
          const offlinePage = await caches.match('/index.html').catch(() => null)
          if (offlinePage) {
            return offlinePage
          }
          // If no offline page, return error response
          return new Response('Network error', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          })
        }
      } catch (error) {
        // During development, if there's an error, don't intercept - let browser handle it
        if (event.request.url.includes('localhost') || event.request.url.includes('127.0.0.1')) {
          // Re-throw to let browser handle the error naturally
          throw error
        }
        
        // Only log errors for non-development requests
        console.error('Fetch handler error:', error)
        // Return a basic error response instead of failing
        return new Response('Network error', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        })
      }
    })()
  )
})
