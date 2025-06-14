
// This is a basic service worker file.
// It's required for a web app to be installable as a PWA.
// For now, it doesn't need to do anything complex like caching.

self.addEventListener('fetch', (event) => {
  // An empty fetch event listener is enough to make the app installable.
});

// Listen for push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  console.log('Push received...', data);

  const title = data.title || 'TIFUE';
  const options = {
    body: data.message || 'لديك تنبيه جديد!',
    icon: '/lovable-uploads/06f33979-d8e4-446e-8d1e-1a89bde7a1b5.png',
    badge: '/lovable-uploads/06f33979-d8e4-446e-8d1e-1a89bde7a1b5.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
