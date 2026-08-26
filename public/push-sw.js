// Receptor de Web Push (Fase 31) — se suma al Service Worker autogenerado por
// Workbox (`vite-plugin-pwa`, modo `generateSW`) vía `workbox.importScripts`
// en `vite.config.ts`. El proyecto sigue sin SW custom propio (ver el
// comentario de Fase 18 en `vite.config.ts`): este archivo es sólo el listener
// mínimo que Workbox no genera solo, corre en el MISMO scope del SW final.
self.addEventListener('push', (event) => {
  let data = { title: 'Unión AMS', body: 'Tenés una notificación nueva.' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    // El payload no era JSON válido — se muestra el fallback en vez de romper.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: data.url || '/' },
    }),
  )
})

// Al tocar la notificación, abre (o enfoca) la app en la URL del payload.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
