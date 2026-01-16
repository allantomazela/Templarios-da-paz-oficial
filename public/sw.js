// Simple Service Worker for offline capabilities
const CACHE_NAME = 'templarios-cache-v4'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico'
]

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
          console.warn('Fetch failed:', err)
          // Try to return offline page if available
          const offlinePage = await caches.match('/index.html').catch(() => null)
          if (offlinePage) {
            return offlinePage
          }
          // If no offline page, throw the original error
          throw err
        }
      } catch (error) {
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
