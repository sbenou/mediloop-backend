
import { useEffect, useState, useCallback, useRef } from 'react';
import { requestNotificationPermission, setupMessageListener } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';

export function useFirebaseNotifications() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Use refs to prevent re-initialization and infinite loops
  const isInitialized = useRef(false);
  const messageListenerCleanup = useRef<(() => void) | null>(null);
  
  // Initialize Firebase notifications - make it completely non-blocking and prevent multiple calls
  const initializeNotifications = useCallback(async () => {
    if (loading || isInitialized.current) return; // Prevent multiple initializations
    
    setLoading(true);
    try {
      console.log('Initializing Firebase notifications...');
      
      // Check if we're in a browser environment with notifications support
      if (typeof window !== 'undefined' && 'Notification' in window) {
        // Check if we already have permission and token
        const storedToken = localStorage.getItem('fcm_token');
        if (storedToken && Notification.permission === 'granted') {
          setFcmToken(storedToken);
          setNotificationPermissionGranted(true);
          isInitialized.current = true;
          setLoading(false);
          return;
        }
        
        try {
          const token = await requestNotificationPermission();
          if (token) {
            setFcmToken(token);
            setNotificationPermissionGranted(true);
            
            // Store token in localStorage for persistence
            localStorage.setItem('fcm_token', token);
            console.log('Firebase notification token saved to localStorage');
            isInitialized.current = true;
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          // Continue even if there's an error with notifications
        }
      } else {
        console.log('Notifications not supported in this environment');
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      // Don't rethrow the error - allow the app to continue functioning
    } finally {
      setLoading(false);
    }
  }, [loading]);
  
  // Handle foreground messages - only set up once and prevent loops
  useEffect(() => {
    if (!notificationPermissionGranted || messageListenerCleanup.current) return;
    
    try {
      const unsubscribe = setupMessageListener((payload) => {
        // Only show toast, don't trigger any other state changes that could cause loops
        toast({
          title: payload.notification?.title || 'New Notification',
          description: payload.notification?.body,
          variant: "default",
        });
      });
      
      messageListenerCleanup.current = unsubscribe;
    } catch (error) {
      console.error('Error setting up message listener:', error);
      // Don't throw error, just log it
    }
    
    return () => {
      if (messageListenerCleanup.current) {
        try {
          messageListenerCleanup.current();
          messageListenerCleanup.current = null;
        } catch (error) {
          console.error('Error cleaning up message listener:', error);
        }
      }
    };
  }, [notificationPermissionGranted]);
  
  // Check for stored token on mount - only once
  useEffect(() => {
    if (isInitialized.current) return;
    
    try {
      const storedToken = localStorage.getItem('fcm_token');
      if (storedToken && Notification.permission === 'granted') {
        setFcmToken(storedToken);
        setNotificationPermissionGranted(true);
        isInitialized.current = true;
        console.log('Firebase token retrieved from localStorage');
      }
    } catch (error) {
      console.error('Error retrieving token from localStorage:', error);
    }
  }, []);
  
  return {
    fcmToken,
    notificationPermissionGranted,
    loading,
    initializeNotifications
  };
}
