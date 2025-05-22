
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth/useAuth';
import { 
  requestNotificationPermission, 
  saveFcmTokenToProfile, 
  setupFirebaseMessaging 
} from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';

export const useFirebaseNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    let cleanupFn = () => {};

    const initializeFirebase = async () => {
      // Skip initialization if conditions aren't met
      if (!isAuthenticated || !user || initialized.current) return;
      
      try {
        console.log('Initializing Firebase notifications');
        initialized.current = true;
        
        // Browser compatibility check
        if (!('Notification' in window)) {
          console.log('This browser does not support desktop notification');
          return;
        }
        
        // Request permission and get token
        const token = await requestNotificationPermission();
        
        if (token) {
          // Save token to user profile
          await saveFcmTokenToProfile(user.id, token);
          
          // Setup message handler for foreground notifications
          cleanupFn = setupFirebaseMessaging();
          
          console.log('Firebase notifications initialized successfully');
        }
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        toast({
          variant: 'destructive',
          title: 'Notification Error',
          description: 'Failed to initialize notifications',
        });
      }
    };

    // Attempt to initialize with a slight delay to ensure other parts are loaded
    const timer = setTimeout(() => {
      initializeFirebase();
    }, 1500);
    
    return () => {
      clearTimeout(timer);
      cleanupFn();
    };
  }, [isAuthenticated, user]);
};
