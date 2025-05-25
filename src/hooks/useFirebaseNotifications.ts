
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
  const initializationInProgress = useRef(false);
  
  // Initialize Firebase notifications - only once per session
  const initializeNotifications = useCallback(async () => {
    if (loading || isInitialized.current || initializationInProgress.current) {
      console.log('Firebase notifications already initialized or in progress');
      return;
    }
    
    initializationInProgress.current = true;
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
          initializationInProgress.current = false;
          setLoading(false);
          console.log('Using cached Firebase token');
          return;
        }
        
        // Only request permission if not already granted
        if (Notification.permission !== 'granted') {
          try {
            const token = await requestNotificationPermission();
            if (token) {
              setFcmToken(token);
              setNotificationPermissionGranted(true);
              
              // Store token in localStorage for persistence
              localStorage.setItem('fcm_token', token);
              console.log('Firebase notification token obtained and saved');
              isInitialized.current = true;
            }
          } catch (error) {
            console.error('Error requesting notification permission:', error);
            // Continue even if there's an error with notifications
          }
        }
      } else {
        console.log('Notifications not supported in this environment');
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      // Don't rethrow the error - allow the app to continue functioning
    } finally {
      setLoading(false);
      initializationInProgress.current = false;
    }
  }, [loading]);
  
  // Handle foreground messages - only set up once per session
  useEffect(() => {
    if (!notificationPermissionGranted || messageListenerCleanup.current || !isInitialized.current) {
      return;
    }
    
    try {
      const unsubscribe = setupMessageListener((payload) => {
        console.log('Firebase message received:', payload);
        // Only show toast for incoming notifications, don't trigger any other state changes
        toast({
          title: payload.notification?.title || 'New Notification',
          description: payload.notification?.body,
          variant: "default",
        });
      });
      
      messageListenerCleanup.current = unsubscribe;
      console.log('Firebase message listener set up successfully');
    } catch (error) {
      console.error('Error setting up message listener:', error);
    }
    
    return () => {
      if (messageListenerCleanup.current) {
        try {
          messageListenerCleanup.current();
          messageListenerCleanup.current = null;
          console.log('Firebase message listener cleaned up');
        } catch (error) {
          console.error('Error cleaning up message listener:', error);
        }
      }
    };
  }, [notificationPermissionGranted, isInitialized.current]);
  
  // Check for stored token on mount - only once
  useEffect(() => {
    if (isInitialized.current || initializationInProgress.current) return;
    
    try {
      const storedToken = localStorage.getItem('fcm_token');
      if (storedToken && Notification.permission === 'granted') {
        setFcmToken(storedToken);
        setNotificationPermissionGranted(true);
        isInitialized.current = true;
        console.log('Firebase token retrieved from localStorage on mount');
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
