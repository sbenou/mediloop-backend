
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
  
  // Initialize Firebase notifications when user is authenticated - only once
  useEffect(() => {
    if (isAuthenticated && !hasInitialized.current && !fcmToken) {
      hasInitialized.current = true;
      
      // Use a longer timeout to ensure auth is fully settled
      const timeoutId = setTimeout(() => {
        initializeNotifications().catch(error => {
          console.error('Error initializing notifications (non-critical):', error);
          // Continue even if notification initialization fails
        });
      }, 2000); // 2 second delay to let auth settle
      
      return () => clearTimeout(timeoutId);
    }
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
