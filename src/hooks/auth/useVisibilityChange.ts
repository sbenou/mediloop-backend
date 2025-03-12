
import { useCallback, useRef } from 'react';
import { supabase, getSessionFromStorage } from '@/lib/supabase';
import { useSessionManagement } from './useSessionManagement';
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { toast } from '@/components/ui/use-toast';

export const useVisibilityChange = () => {
  const setAuth = useSetRecoilState(authState);
  const { updateAuthState } = useSessionManagement();
  const lastSessionCheckRef = useRef<number>(0);

  const handleVisibilityChange = useCallback(async () => {
    if (document.visibilityState === 'visible') {
      // Avoid spamming multiple session checks in rapid succession
      const now = Date.now();
      if (now - lastSessionCheckRef.current < 2000) {
        console.log('Skipping redundant session check within 2 seconds');
        return;
      }
      
      lastSessionCheckRef.current = now;
      console.log("Tab became visible, checking auth state");
      
      try {
        // Get stored session from localStorage/sessionStorage
        const storedSession = getSessionFromStorage();
        const currentUserState = storedSession?.user?.id;
        
        // Always get fresh session from API
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session on visibility change:", error);
          return;
        }
        
        const newUserState = session?.user?.id;
        
        // If stored user doesn't match API session user
        if (currentUserState && !newUserState) {
          console.log("Session expired while tab was hidden");
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
          
          toast({
            variant: "destructive",
            title: "Session expired",
            description: "Your session has expired. Please login again.",
          });
        } else if (newUserState && (!currentUserState || currentUserState !== newUserState)) {
          console.log("Session changed while tab was hidden");
          await updateAuthState(session);
        } else if (newUserState && currentUserState === newUserState) {
          // Same user, ensure the session is fully loaded and fresh
          console.log("Same user, ensuring session is fully loaded");
          
          // Store the fresh session anyway to update expiry
          if (session) {
            const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
            try {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
              window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
              console.log("Updated session storage with fresh session");
            } catch (storageError) {
              console.error('Error updating session:', storageError);
            }
          }
        }
      } catch (err) {
        console.error("Error during visibility change auth check:", err);
      }
    }
  }, [setAuth, updateAuthState]);

  return { handleVisibilityChange };
};
