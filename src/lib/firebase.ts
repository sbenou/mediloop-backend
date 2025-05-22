
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB33prcKnth3KakMlCEKlQETT-LzPr5yZM",
  authDomain: "mediloop-test-4f9ea.firebaseapp.com",
  projectId: "mediloop-test-4f9ea",
  storageBucket: "mediloop-test-4f9ea.appspot.com",
  messagingSenderId: "1056108254776",
  appId: "1:1056108254776:web:0ff671d7c82010895b35c1",
  measurementId: "G-XKD3B00TQ0"
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
      vapidKey: "BLuTOOXpZMy0DUO3rsZ7vDD5wVLZGTtbMJMtplYI7_snBGBw9kaP80tCCq41EeHRWp92BP7BkihXEBf6kgG6nDw"
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
