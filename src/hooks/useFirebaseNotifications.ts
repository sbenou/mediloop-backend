
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
      if (!isAuthenticated || !user || initialized.current) return;
      
      try {
        console.log('Initializing Firebase notifications');
        initialized.current = true;
        
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

    initializeFirebase();
    
    return () => {
      cleanupFn();
    };
  }, [isAuthenticated, user]);
};
