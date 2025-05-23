
import { useEffect, useState, useCallback } from 'react';
import { requestNotificationPermission, setupMessageListener } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

export function useFirebaseNotifications() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Initialize Firebase notifications
  const initializeNotifications = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Initializing Firebase notifications...');
      
      // Check if we're in a browser environment with notifications support
      if (typeof window !== 'undefined' && 'Notification' in window) {
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
  }, []);
  
  // Handle foreground messages
  useEffect(() => {
    if (!notificationPermissionGranted) return;
    
    try {
      const unsubscribe = setupMessageListener((payload) => {
        // Display a toast notification for foreground messages
        toast({
          title: payload.notification?.title || 'New Notification',
          description: payload.notification?.body,
          variant: "default",
        });
      });
      
      return () => {
        unsubscribe && unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up message listener:', error);
      // Don't throw error, just log it
    }
  }, [notificationPermissionGranted]);
  
  // Check for stored token on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('fcm_token');
      if (storedToken) {
        setFcmToken(storedToken);
        setNotificationPermissionGranted(true);
        console.log('Firebase token retrieved from localStorage');
      }
    } catch (error) {
      console.error('Error retrieving token from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    fcmToken,
    notificationPermissionGranted,
    loading,
    initializeNotifications
  };
}
