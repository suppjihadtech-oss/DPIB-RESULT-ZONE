// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC0yiG0E_DTsa9ARXr8zPBzrPMWjaRBkPQ",
  authDomain: "gen-lang-client-0134991257.firebaseapp.com",
  projectId: "gen-lang-client-0134991257",
  storageBucket: "gen-lang-client-0134991257.firebasestorage.app",
  messagingSenderId: "244388494728",
  appId: "1:244388494728:web:9b86b9bd78d51c65844e3d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'DPIB RESULT ZONE';
  const notificationBody = payload.notification?.body || payload.data?.body || 'নতুন নোটিশ অথবা ফলাফল প্রকাশিত হয়েছে।';
  const icon = payload.notification?.icon || payload.data?.icon || 'https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png';
  const badge = 'https://i.postimg.cc/mgyW32Y2/Firefly-Remove-Background.png';
  
  const targetUrl = payload.data?.url || payload.data?.click_action || payload.fcmOptions?.link || '/';
  
  const notificationOptions = {
    body: notificationBody,
    icon: icon,
    badge: badge,
    data: {
      url: targetUrl,
      time: Date.now()
    },
    vibrate: [100, 50, 100],
    requireInteraction: true
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received: ', event);
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if client is already open and focus/navigate it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // If not open, open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
