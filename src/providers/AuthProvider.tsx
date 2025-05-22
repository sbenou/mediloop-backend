
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { toast } from 'sonner';
import { useSessionManagement } from '@/hooks/auth/useSessionManagement';
import { useVisibilityChange } from '@/hooks/auth/useVisibilityChange';
import { useStorageEvents } from '@/hooks/auth/useStorageEvents';
import { useSessionPolling } from '@/hooks/auth/useSessionPolling';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);
  const { updateAuthState } = useSessionManagement();
  const { handleVisibilityChange } = useVisibilityChange();
  const { handleStorageChange, handleTokenUpdate } = useStorageEvents();
  
  useSessionPolling();

  useEffect(() => {
    let mounted = true;
    console.log('[AuthProvider] Initializing auth provider');

    const initializeAuth = async () => {
      try {
        console.log('[AuthProvider] Starting auth initialization', {
          timestamp: new Date().toISOString()
        });
        
        setAuth(prev => ({ ...prev, isLoading: true }));
        
        // Get session directly from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session) {
          console.log('[AuthProvider] Found active session for user:', {
            userId: session.user.id,
            timestamp: new Date().toISOString()
          });
          await updateAuthState(session);
        } else {
          console.log('[AuthProvider] No active session found, clearing auth state');
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('[AuthProvider] Auth initialization error:', error);
        if (mounted) {
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
          
          toast.error("Authentication Error: Failed to initialize authentication");
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('[AuthProvider] Auth state changed:', {
          event,
          userId: session?.user?.id,
          timestamp: new Date().toISOString()
        });

        if (event === 'SIGNED_IN' && session) {
          console.log('[AuthProvider] Processing SIGNED_IN event');
          await updateAuthState(session);
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthProvider] Processing SIGNED_OUT event');
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        } else if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session) {
          console.log('[AuthProvider] Processing token refresh/user update');
          await updateAuthState(session);
        }
      }
    );
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setAuth, updateAuthState, handleVisibilityChange, handleStorageChange]);

  // Listen for custom auth token update events
  useEffect(() => {
    window.addEventListener('supabase:auth:token:update', handleTokenUpdate);
    
    return () => {
      window.removeEventListener('supabase:auth:token:update', handleTokenUpdate);
    };
  }, [handleTokenUpdate]);

  return <>{children}</>;
};

export default AuthProvider;
