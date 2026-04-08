import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// SheetJS CDN önbelleği
registerRoute(
  ({ url }) => url.hostname === 'cdn.sheetjs.com',
  new CacheFirst({
    cacheName: 'sheetjs-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
)

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
