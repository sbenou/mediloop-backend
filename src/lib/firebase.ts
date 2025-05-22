
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

// Firebase configuration - replace with your own Firebase config values
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",              // Replace with your actual API key
  authDomain: "REPLACE_WITH_YOUR_AUTH_DOMAIN",      // Replace with your actual auth domain
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",        // Replace with your actual project ID
  storageBucket: "REPLACE_WITH_YOUR_STORAGE_BUCKET",// Replace with your actual storage bucket
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID", // Replace with your actual sender ID
  appId: "REPLACE_WITH_YOUR_APP_ID",                // Replace with your actual app ID
  measurementId: "REPLACE_WITH_YOUR_MEASUREMENT_ID" // Replace with your actual measurement ID
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
      vapidKey: "REPLACE_WITH_YOUR_VAPID_KEY"  // Replace with your actual VAPID key
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
