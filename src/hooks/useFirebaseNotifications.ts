
import { useEffect, useState, useCallback } from 'react';
import { requestNotificationPermission, setupMessageListener } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';

export function useFirebaseNotifications() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Initialize Firebase notifications - make it completely non-blocking
  const initializeNotifications = useCallback(async () => {
    if (loading) return; // Prevent multiple initializations
    
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
  
  // Handle foreground messages - only set up once
  useEffect(() => {
    if (!notificationPermissionGranted) return;
    
    let unsubscribe: (() => void) | null = null;
    
    try {
      unsubscribe = setupMessageListener((payload) => {
        // Display a toast notification for foreground messages
        toast({
          title: payload.notification?.title || 'New Notification',
          description: payload.notification?.body,
          variant: "default",
        });
      });
    } catch (error) {
      console.error('Error setting up message listener:', error);
      // Don't throw error, just log it
    }
    
    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from message listener:', error);
        }
      }
    };
  }, [notificationPermissionGranted]);
  
  // Check for stored token on mount - only once
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('fcm_token');
      if (storedToken && Notification.permission === 'granted') {
        setFcmToken(storedToken);
        setNotificationPermissionGranted(true);
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
