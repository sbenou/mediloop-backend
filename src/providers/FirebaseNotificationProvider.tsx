
import React, { createContext, useContext, useEffect } from 'react';
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
  
  // Initialize Firebase notifications when user is authenticated
  useEffect(() => {
    // Make initialization non-blocking to prevent blank page
    let isMounted = true;
    
    const initialize = async () => {
      if (isAuthenticated && !fcmToken && isMounted) {
        try {
          console.log('Starting notification initialization');
          await initializeNotifications();
          console.log('Notification initialization completed');
        } catch (error) {
          console.error('Error initializing notifications (non-critical):', error);
          // Continue rendering even if notification initialization fails
        }
      }
    };
    
    // Use setTimeout to ensure this doesn't block initial render
    setTimeout(initialize, 100);
    
    return () => {
      isMounted = false;
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
