
// Firebase Cloud Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyB33prcKnth3KakMlCEKlQETT-LzPr5yZM",
  authDomain: "mediloop-test-4f9ea.firebaseapp.com",
  projectId: "mediloop-test-4f9ea",
  storageBucket: "mediloop-test-4f9ea.appspot.com",
  messagingSenderId: "1056108254776",
  appId: "1:1056108254776:web:0ff671d7c82010895b35c1",
  measurementId: "G-XKD3B00TQ0"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', event => {
  const clickedNotification = event.notification;
  clickedNotification.close();
  
  // Handle notification click - navigate to appropriate page
  const urlToOpen = new URL('/notifications', self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then(windowClients => {
      // If a window client is already open, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
