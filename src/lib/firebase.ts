
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

// Firebase configuration - replace with your actual Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "placeholder-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "placeholder-messaging-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "placeholder-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "placeholder-measurement-id"
};

// Initialize Firebase only in browser environment
let app;
let messaging = null;

try {
  // Only initialize Firebase in browser environment
  if (typeof window !== 'undefined') {
    app = initializeApp(firebaseConfig);
    // Only try to get messaging in supported browsers
    if ('serviceWorker' in navigator) {
      messaging = getMessaging(app);
      console.log('Firebase messaging initialized');
    }
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Request permission and get token
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      console.log('Messaging not available');
      return null;
    }
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }
    
    // Get the token
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "placeholder-vapid-key"
    });
    
    if (currentToken) {
      console.log('FCM token:', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

// Save FCM token to user profile
export const saveFcmTokenToProfile = async (userId: string, token: string) => {
  try {
    if (!token) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: token })
      .eq('id', userId);
      
    if (error) {
      console.error('Error saving FCM token:', error);
    }
  } catch (error) {
    console.error('Failed to save FCM token:', error);
  }
};

// Setup onMessage listener for foreground messages
export const setupFirebaseMessaging = () => {
  if (!messaging) {
    console.log('Messaging not available for foreground messages');
    return () => {};
  }
  
  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      // Display notification as toast
      if (payload.notification) {
        toast({
          title: payload.notification.title || 'New Notification',
          description: payload.notification.body || '',
          duration: 5000,
        });
      }
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return () => {};
  }
};

export { app };
