const CACHE = 'chatflow-v1';
const ASSETS = [
  '/chatflow.html',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Supabase-Requests immer live holen
  if (e.request.url.includes('supabase.co')) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Push-Notifications vom Service Worker
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'ChatFlow', {
      body: data.body || 'Neue Nachricht',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'chatflow',
      renotify: true,
      data: { url: data.url || '/chatflow.html' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) {
        if (c.url.includes('chatflow') && 'focus' in c) return c.focus();
      }
      return clients.openWindow(e.notification.data.url);
    })
  );
});
