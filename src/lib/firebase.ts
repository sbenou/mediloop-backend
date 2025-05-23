
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC74XOrzBelLF1NZDLdNpzlvtDd88FmJHs",
  authDomain: "mediloop-app.firebaseapp.com",
  projectId: "mediloop-app",
  storageBucket: "mediloop-app.appspot.com",
  messagingSenderId: "670327127852",
  appId: "1:670327127852:web:b73463765fdcfc086c9c2d",
  measurementId: "G-8RQNMT898B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Function to request permission and get FCM token
export const requestNotificationPermission = async () => {
  console.log('Requesting notification permission...');
  
  try {
    // Check if notification permission is already granted
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get the FCM token
      const currentToken = await getToken(messaging, {
        vapidKey: 'BK2yjKiT7Faf6GDkPBWTIWXqZFCZcI1ODQxsJI4_SpU26Md1c-9GVPYBqRWY6up56CrSCPbU18bi4RXdQtGZwxE'
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
export const setupMessageListener = (callback: (payload: any) => void) => {
  return onMessage(messaging, (payload) => {
    console.log('Message received in the foreground:', payload);
    callback(payload);
  });
};

export { messaging };
