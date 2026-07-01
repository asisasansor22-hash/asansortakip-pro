import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Yeni sürüm yüklenince beklemeden devreye gir + açık sayfaların kontrolünü al.
// Böylece uygulamayı silip yeniden kurmaya gerek kalmaz; sayfa kendini yeniler.
self.skipWaiting()
clientsClaim()

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

// FCM web push: uygulama kapalıyken gelen bildirimi göster
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (e) {}
  const n = (data && data.notification) || {}
  const title = n.title || 'AsansörTakip'
  event.waitUntil(self.registration.showNotification(title, {
    body: n.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: 'at-bakim-' + Date.now(),
    data: { url: (data.fcmOptions && data.fcmOptions.link) || '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
