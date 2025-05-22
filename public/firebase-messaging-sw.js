
// Firebase Cloud Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyC-0lCh14I22Fc2AFfWhyy6qPGU7vmDk5c",
  authDomain: "mediloop-6b3d3.firebaseapp.com",
  projectId: "mediloop-6b3d3",
  storageBucket: "mediloop-6b3d3.firebasestorage.app",
  messagingSenderId: "1092279546397",
  appId: "1:1092279546397:web:0a2f285ef6c941d77a8cf4",
  measurementId: "G-43SY8P58FS"
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
