
import { useCallback } from 'react';
import { getSessionFromStorage } from '@/lib/supabase';
import { useSessionManagement } from './useSessionManagement';
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { supabase } from '@/lib/supabase';

export const useStorageEvents = () => {
  const setAuth = useSetRecoilState(authState);
  const { updateAuthState } = useSessionManagement();

  const handleStorageChange = useCallback((e: StorageEvent) => {
    if (!e.key) return;
    
    // Check for auth token changes
    if (e.key.includes('auth-token')) {
      console.log("Auth token changed in another tab");
      
      // Get the session from storage and update state if needed
      const storedSession = getSessionFromStorage();
      
      if (storedSession?.user?.id) {
        console.log("Found valid session in storage after change");
        updateAuthState(storedSession);
      } else if (e.newValue === null) {
        // Token was removed in another tab
        console.log("Auth token was removed in another tab");
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
      }
    }
    
    // Check for explicit auth events
    if (e.key === 'last_auth_event' && e.newValue) {
      try {
        const event = JSON.parse(e.newValue);
        
        if (event.type === 'LOGOUT') {
          console.log("Logout detected in another tab");
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        } else if (event.type === 'LOGIN') {
          console.log("Login detected in another tab");
          // Force refresh the session
          supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
              updateAuthState(data.session);
            }
          });
        } else if (event.type === 'TOKEN_REFRESHED') {
          console.log("Token refresh detected in another tab");
          // Get the latest session
          supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
              updateAuthState(data.session);
            }
          });
        }
      } catch (error) {
        console.error("Error processing auth event:", error);
      }
    }
  }, [updateAuthState, setAuth]);

  const handleTokenUpdate = useCallback((e: Event) => {
    const customEvent = e as CustomEvent;
    console.log('Received token update event:', customEvent.detail);
    
    // Force a session check
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        updateAuthState(data.session);
      }
    });
  }, [updateAuthState]);

  return {
    handleStorageChange,
    handleTokenUpdate
  };
};
