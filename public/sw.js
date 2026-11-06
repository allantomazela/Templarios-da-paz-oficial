/**
 * Service Worker mínimo para PWA (manifest / “instalar app”).
 *
 * NÃO interceptamos fetch nem guardamos HTML/JS em CacheStorage: isso causava
 * em sessões normais HTML novo + assets antigos (nomes fixos) ou shell em cache,
 * enquanto aba anônima sem cache “funcionava”.
 *
 * Ao ativar, apagamos caches antigos deste domínio para limpar instalações anteriores.
 * Versão lógica: v15 (push do aviso da loja; sem interceptação de fetch).
 */

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        if ('caches' in self) {
          const keys = await caches.keys()
          await Promise.all(
            keys.map((name) =>
              caches.delete(name).catch(() => {}),
            ),
          )
        }
      } catch (e) {
        console.warn('[SW] activate cache cleanup', e)
      }
      await self.clients.claim()
    })(),
  )
})

// Sem listener de "fetch": toda requisição segue o comportamento normal do navegador.

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Templários da Paz',
    body: 'Novo aviso da loja.',
    url: '/dashboard/agenda',
    tag: 'lodge-broadcast',
  }
  try {
    if (event.data) {
      const parsed = event.data.json()
      payload = { ...payload, ...parsed }
    }
  } catch {
    // Mantém o texto padrão se o corpo não for JSON.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/favicon.png',
      tag: payload.tag || 'lodge-broadcast',
      data: { url: payload.url || '/dashboard/agenda' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/dashboard/agenda'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('focus' in client) {
          client.navigate?.(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
