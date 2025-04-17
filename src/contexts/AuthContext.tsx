
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
    let isMounted = true;
    let initTimeoutId: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      try {
        console.log("Starting auth initialization");
        
        // Create a timeout promise with increased timeout (8 seconds instead of 5)
        const sessionPromise = refreshSession();
        const timeoutPromise = new Promise<null>(resolve => {
          initTimeoutId = setTimeout(() => {
            console.warn('Auth initialization is taking longer than expected (8 seconds)');
            resolve(null);
          }, 8000);
        });
        
        // Race the session fetch against the timeout
        const session = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (!isMounted) return;
        
        if (session) {
          console.log("Found existing session, updating auth state");
          // Use a setTimeout to prevent blocking the UI
          setTimeout(() => {
            if (isMounted) {
              updateAuthState(session);
            }
          }, 0);
        } else {
          console.log("No existing session found or session fetch timed out");
          // Still update auth state but with null session
          if (isMounted) {
            updateAuthState(null);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Update auth state with null on error
        if (isMounted) {
          updateAuthState(null);
        }
      }
    };
    
    initializeAuth();
    
    // Listen for auth changes from other tabs with a more robust approach
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key?.includes('auth-token')) {
        console.log('Auth token changed in another tab, refreshing session');
        setTimeout(async () => {
          if (!isMounted) return;
          const session = await refreshSession();
          if (session && isMounted) {
            updateAuthState(session);
          } else if (isMounted) {
            // If no session is found after a storage event, it might mean logout
            updateAuthState(null);
          }
        }, 0);
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageEvent);
      if (initTimeoutId) clearTimeout(initTimeoutId);
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
