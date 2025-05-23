
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
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        setNotificationPermissionGranted(true);
        
        // Store token in localStorage for persistence
        localStorage.setItem('fcm_token', token);
        
        // Here you would typically send this token to your backend
        // to associate it with the current user
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Handle foreground messages
  useEffect(() => {
    if (!notificationPermissionGranted) return;
    
    const unsubscribe = setupMessageListener((payload) => {
      // Display a toast notification for foreground messages
      toast({
        title: payload.notification?.title || 'New Notification',
        description: payload.notification?.body,
        variant: "default",
      });
      
      // You might want to update your notifications state here
      // or trigger a refetch of notifications
    });
    
    return () => {
      unsubscribe && unsubscribe();
    };
  }, [notificationPermissionGranted]);
  
  // Check for stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('fcm_token');
    if (storedToken) {
      setFcmToken(storedToken);
      setNotificationPermissionGranted(true);
    }
    setLoading(false);
  }, []);
  
  return {
    fcmToken,
    notificationPermissionGranted,
    loading,
    initializeNotifications
  };
}
