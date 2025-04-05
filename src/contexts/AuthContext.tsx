
import React, { createContext, useContext, useEffect } from 'react';
import { RecoilRoot } from 'recoil';
import { useSessionManagement } from '@/hooks/auth/useSessionManagement';
import { useSessionPolling } from '@/hooks/auth/useSessionPolling';

// Create context that will provide authentication functionality
const AuthContext = createContext<null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider wraps the application and provides authentication state
 * and functionality to all child components
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { updateAuthState, refreshSession } = useSessionManagement();
  
  // Set up session polling for token refresh
  useSessionPolling();
  
  // On initial load, check for existing session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const session = await refreshSession();
        
        if (session) {
          console.log("Found existing session, updating auth state");
          await updateAuthState(session);
        } else {
          console.log("No existing session found");
          // Still update auth state but with null session
          await updateAuthState(null);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Update auth state with null on error
        await updateAuthState(null);
      }
    };
    
    initializeAuth();
    
    // Listen for auth changes from other tabs
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key?.includes('auth-token')) {
        console.log('Auth token changed in another tab, refreshing session');
        refreshSession().then(session => {
          if (session) {
            updateAuthState(session);
          } else {
            // If no session is found after a storage event, it might mean logout
            updateAuthState(null);
          }
        });
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [updateAuthState, refreshSession]);
  
  return (
    <AuthContext.Provider value={null}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Wrap the AuthProvider with RecoilRoot to ensure Recoil state management
 * is available throughout the authentication context
 */
export const AuthProviderWithRecoil: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <RecoilRoot>
      <AuthProvider>{children}</AuthProvider>
    </RecoilRoot>
  );
};

// Export a hook for using the auth context
export const useAuthContext = () => {
  return useContext(AuthContext);
};
