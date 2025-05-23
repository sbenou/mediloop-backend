
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
    if (isAuthenticated && !fcmToken) {
      try {
        initializeNotifications();
      } catch (error) {
        console.error('Error initializing notifications:', error);
        // Continue rendering even if notification initialization fails
      }
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
