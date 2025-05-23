
// Firebase Service Worker for handling background notifications

importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Firebase configuration - must match the one in src/lib/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyC-0lCh14I22Fc2AFfWhyy6qPGU7vmDk5c",
  authDomain: "mediloop-6b3d3.firebaseapp.com",
  projectId: "mediloop-6b3d3",
  storageBucket: "mediloop-6b3d3.firebasestorage.app",
  messagingSenderId: "1092279546397",
  appId: "1:1092279546397:web:0a2f285ef6c941d77a8cf4",
  measurementId: "G-43SY8P58FS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click handled');
  
  event.notification.close();
  
  // This looks to see if the current window is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow('/notifications');
      }
    })
  );
});
