/* global self, clients */
// Обработчики Web Push. Подключаются в сгенерированный service worker через
// workbox.importScripts (см. vite.config.ts). Срабатывают, даже когда PWA закрыто.

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Нет энергетикам'
  const options = {
    body: data.body || 'Не забудь отметить сегодняшний день 💜',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'daily-reminder',
    data: { url: data.url || '/' },
    vibrate: [80, 40, 80],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus()
      }
      return clients.openWindow(url)
    }),
  )
})
