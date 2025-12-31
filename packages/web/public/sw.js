/* eslint-disable no-undef */
self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'You have a new update from HireAll',
        icon: '/favicon.ico',
        badge: '/icon-192.png',
        data: {
          url: data.url || '/'
        },
        actions: [
          {
            action: 'open',
            title: 'View Details'
          }
        ]
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'HireAll Update', options)
      );
    } catch (e) {
      // Fallback for non-JSON push data
      const options = {
        body: event.data.text(),
        icon: '/favicon.ico',
        badge: '/icon-192.png'
      };
      event.waitUntil(
        self.registration.showNotification('HireAll Update', options)
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
