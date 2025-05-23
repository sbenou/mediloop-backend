
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration
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
const app = initializeApp(firebaseConfig);
const messaging = typeof window !== 'undefined' && 'Notification' in window ? getMessaging(app) : null;

// Function to request permission and get FCM token
export const requestNotificationPermission = async () => {
  console.log('Requesting notification permission...');
  
  try {
    if (!messaging) {
      console.error('Firebase messaging not initialized or not supported in this environment');
      return null;
    }
    
    // Check if notification permission is already granted
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get the FCM token
      const currentToken = await getToken(messaging, {
        vapidKey: 'BLCaFclmh-2Cegf7Qc4XM9ZbL1cf9_73VKJUDsKRpGbAD3gObsp7uLLxNlN6PdEUgz9KpFaI31L3Go6JWdRgXkU'
      });
      
      if (currentToken) {
        console.log('FCM token obtained:', currentToken);
        return currentToken;
      } else {
        console.warn('No registration token available. Request permission to generate one.');
        return null;
      }
    } else {
      console.warn('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Function to handle foreground messages
export const setupMessageListener = (callback) => {
  if (!messaging) {
    console.warn('Firebase messaging not initialized or not supported in this environment');
    return () => {};
  }
  
  try {
    return onMessage(messaging, (payload) => {
      console.log('Message received in the foreground:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return () => {};
  }
};

export { messaging };
