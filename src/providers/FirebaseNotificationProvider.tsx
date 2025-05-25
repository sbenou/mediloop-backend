
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';
import { useAuth } from '@/hooks/auth/useAuth';

type FirebaseNotificationContextType = {
  fcmToken: string | null;
  notificationPermissionGranted: boolean;
  loading: boolean;
  initializeNotifications: () => Promise<void>;
};

const FirebaseNotificationContext = createContext<FirebaseNotificationContextType | undefined>(undefined);

export const FirebaseNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { fcmToken, notificationPermissionGranted, loading, initializeNotifications } = useFirebaseNotifications();
  const { isAuthenticated } = useAuth();
  const hasInitialized = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize Firebase notifications when user is authenticated - only once
  useEffect(() => {
    // Clear any existing timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    if (isAuthenticated && !hasInitialized.current && !fcmToken) {
      hasInitialized.current = true;
      
      // Use a longer timeout to ensure auth is fully settled and prevent conflicts
      initTimeoutRef.current = setTimeout(() => {
        initializeNotifications().catch(error => {
          console.error('Error initializing notifications (non-critical):', error);
          // Continue even if notification initialization fails
        });
      }, 5000); // 5 second delay to let auth settle completely
    }
    
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, fcmToken, initializeNotifications]);
  
  return (
    <FirebaseNotificationContext.Provider
      value={{
        fcmToken,
        notificationPermissionGranted,
        loading,
        initializeNotifications
      }}
    >
      {children}
    </FirebaseNotificationContext.Provider>
  );
};

export const useFirebaseNotificationContext = () => {
  const context = useContext(FirebaseNotificationContext);
  if (context === undefined) {
    throw new Error('useFirebaseNotificationContext must be used within a FirebaseNotificationProvider');
  }
  return context;
};
