
import { useEffect, useState, useCallback, useRef } from 'react';
import { requestNotificationPermission, setupMessageListener } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

export function useFirebaseNotifications() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Use refs to prevent re-initialization and infinite loops
  const isInitialized = useRef(false);
  const messageListenerCleanup = useRef<(() => void) | null>(null);
  const initializationInProgress = useRef(false);
  
  // Helper function to check if we're in a valid context for notifications
  const isNotificationContextValid = useCallback(() => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') return false;
      
      // Check if notifications are supported
      if (!('Notification' in window)) return false;
      
      // Check if we're in a top-level document (not in iframe)
      if (window !== window.top) {
        console.log('Firebase notifications: Not in top-level document, skipping notification setup');
        return false;
      }
      
      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        console.log('Firebase notifications: Not in secure context, skipping notification setup');
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Firebase notifications: Error checking notification context:', error);
      return false;
    }
  }, []);
  
  // Initialize Firebase notifications - only once per session
  const initializeNotifications = useCallback(async () => {
    if (loading || isInitialized.current || initializationInProgress.current) {
      console.log('Firebase notifications already initialized or in progress');
      return;
    }
    
    // Check if notification context is valid before proceeding
    if (!isNotificationContextValid()) {
      console.log('Firebase notifications: Invalid context, skipping initialization');
      setLoading(false);
      initializationInProgress.current = false;
      return;
    }
    
    initializationInProgress.current = true;
    setLoading(true);
    
    try {
      console.log('Initializing Firebase notifications...');
      
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
      
      // Only request permission if not already granted and context is valid
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
          } else {
            console.log('Firebase notification permission denied or failed to get token');
          }
        } catch (error) {
          console.warn('Error requesting notification permission (non-critical):', error);
          // Continue even if there's an error with notifications
        }
      }
    } catch (error) {
      console.warn('Error initializing notifications (non-critical):', error);
      // Don't rethrow the error - allow the app to continue functioning
    } finally {
      setLoading(false);
      initializationInProgress.current = false;
    }
  }, [loading, isNotificationContextValid]);
  
  // Handle foreground messages - only set up once per session
  useEffect(() => {
    if (!notificationPermissionGranted || messageListenerCleanup.current || !isInitialized.current) {
      return;
    }
    
    // Double-check context validity before setting up listener
    if (!isNotificationContextValid()) {
      console.log('Firebase notifications: Invalid context for message listener');
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
      console.warn('Error setting up message listener (non-critical):', error);
    }
    
    return () => {
      if (messageListenerCleanup.current) {
        try {
          messageListenerCleanup.current();
          messageListenerCleanup.current = null;
          console.log('Firebase message listener cleaned up');
        } catch (error) {
          console.warn('Error cleaning up message listener:', error);
        }
      }
    };
  }, [notificationPermissionGranted, isInitialized.current, isNotificationContextValid]);
  
  // Check for stored token on mount - only once
  useEffect(() => {
    if (isInitialized.current || initializationInProgress.current) return;
    
    // Check context validity before checking stored token
    if (!isNotificationContextValid()) {
      console.log('Firebase notifications: Invalid context, skipping token check');
      return;
    }
    
    try {
      const storedToken = localStorage.getItem('fcm_token');
      if (storedToken && Notification.permission === 'granted') {
        setFcmToken(storedToken);
        setNotificationPermissionGranted(true);
        isInitialized.current = true;
        console.log('Firebase token retrieved from localStorage on mount');
      }
    } catch (error) {
      console.warn('Error retrieving token from localStorage (non-critical):', error);
    }
  }, [isNotificationContextValid]);
  
  return {
    fcmToken,
    notificationPermissionGranted,
    loading,
    initializeNotifications
  };
}
