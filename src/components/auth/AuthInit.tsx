
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { useSessionManagement } from '@/hooks/auth/useSessionManagement';

export const AuthInit = () => {
  const setAuth = useSetRecoilState(authState);
  const { updateAuthState } = useSessionManagement();

  useEffect(() => {
    console.log("[AuthInit][DEBUG] Initializing auth state");
    
    // Set initial loading state
    setAuth(prev => ({ ...prev, isLoading: true }));
    
    // First try to get any existing session
    const initializeAuth = async () => {
      try {
        // Get current session directly from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AuthInit][DEBUG] Error getting session:", error);
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false
          });
          return;
        }
        
        if (session) {
          console.log("[AuthInit][DEBUG] Session found, updating auth state");
          await updateAuthState(session);
        } else {
          console.log("[AuthInit][DEBUG] No session found, clearing auth state");
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false
          });
        }
      } catch (error) {
        console.error("[AuthInit][DEBUG] Error initializing auth:", error);
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    initializeAuth();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthInit][DEBUG] Auth state changed:", event);
      
      if (event === 'SIGNED_IN') {
        console.log("[AuthInit][DEBUG] User signed in, updating auth state");
        await updateAuthState(session);
      } else if (event === 'SIGNED_OUT') {
        console.log("[AuthInit][DEBUG] User signed out, clearing auth state");
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false
        });
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("[AuthInit][DEBUG] Token refreshed, updating auth state");
        await updateAuthState(session);
      } else if (event === 'USER_UPDATED') {
        console.log("[AuthInit][DEBUG] User updated, updating auth state");
        await updateAuthState(session);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setAuth, updateAuthState]);
  
  // This component doesn't render anything
  return null;
};

export default AuthInit;
