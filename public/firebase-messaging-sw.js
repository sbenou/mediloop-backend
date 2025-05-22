// This is a placeholder service worker file for Firebase Cloud Messaging
// Replace the placeholder values with your actual Firebase configuration

// Try/catch block to prevent fatal errors
try {
  importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

  // Replace with your Firebase config - these placeholders prevent immediate errors
  firebase.initializeApp({
    apiKey: "placeholder-api-key",
    authDomain: "placeholder-auth-domain",
    projectId: "placeholder-project-id",
    storageBucket: "placeholder-storage-bucket",
    messagingSenderId: "placeholder-messaging-sender-id",
    appId: "placeholder-app-id",
    measurementId: "placeholder-measurement-id"
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
} catch (error) {
  console.error('Firebase SW initialization error:', error);
}
