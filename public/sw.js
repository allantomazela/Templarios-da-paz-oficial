// Simple Service Worker for offline capabilities
const CACHE_NAME = 'templarios-cache-v3'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Try to add all URLs, but don't fail if some are missing
      return Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to cache ${url}:`, err)
            return null
          })
        )
      )
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }
      // Cache miss - fetch from network
      return fetch(event.request).catch((err) => {
        console.warn('Fetch failed:', err)
        // Return a basic offline page if available
        return caches.match('/index.html')
      })
    })
  )
})
