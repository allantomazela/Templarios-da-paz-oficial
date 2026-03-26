/**
 * Service Worker mínimo para PWA (manifest / “instalar app”).
 *
 * NÃO interceptamos fetch nem guardamos HTML/JS em CacheStorage: isso causava
 * em sessões normais HTML novo + assets antigos (nomes fixos) ou shell em cache,
 * enquanto aba anônima sem cache “funcionava”.
 *
 * Ao ativar, apagamos caches antigos deste domínio para limpar instalações anteriores.
 * Versão lógica: v11 (sem interceptação de fetch).
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
