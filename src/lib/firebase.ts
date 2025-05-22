
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

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
      vapidKey: "BLCaFclmh-2Cegf7Qc4XM9ZbL1cf9_73VKJUDsKRpGbAD3gObsp7uLLxNlN6PdEUgz9KpFaI31L3Go6JWdRgXkU"
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
