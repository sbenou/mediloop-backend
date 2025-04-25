import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase, getSessionFromStorage } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { toast } from '@/components/ui/use-toast';
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

    const initializeAuth = async () => {
      try {
        console.log('[AuthProvider] Starting auth initialization', {
          timestamp: new Date().toISOString()
        });
        
        setAuth(prev => ({ ...prev, isLoading: true }));
        
        const storedSession = getSessionFromStorage();
        
        if (storedSession) {
          console.log('[AuthProvider] Found stored session:', {
            userId: storedSession.user?.id,
            timestamp: new Date().toISOString()
          });
          
          if (mounted) {
            setAuth(prev => ({
              ...prev,
              user: storedSession.user,
              isLoading: true,
            }));
          }
        }
        
        console.log('[AuthProvider] Fetching fresh session from API');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthProvider] Error getting session from API:', error);
          throw error;
        }
        
        if (!mounted) return;
        
        if (session) {
          console.log('[AuthProvider] Using API session for user:', {
            userId: session.user.id,
            timestamp: new Date().toISOString()
          });
          await updateAuthState(session);
        } else if (storedSession?.user?.id) {
          console.log('[AuthProvider] API returned no session but found one in storage');
          // Try to refresh the session
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('Error refreshing stored session:', refreshError);
              if (mounted) {
                setAuth({
                  user: null,
                  profile: null,
                  permissions: [],
                  isLoading: false,
                });
              }
              return;
            }
            
            if (refreshData.session) {
              console.log('Successfully refreshed stored session');
              if (mounted) {
                await updateAuthState(refreshData.session);
              }
              return;
            }
          } catch (refreshErr) {
            console.error('Exception during session refresh:', refreshErr);
          }
          
          // If we reach here, we couldn't refresh the session
          console.log('Could not refresh stored session, clearing auth state');
          if (mounted) {
            setAuth({
              user: null,
              profile: null,
              permissions: [],
              isLoading: false,
            });
          }
        } else {
          console.log('[AuthProvider] No active session found, clearing auth state');
          if (mounted) {
            setAuth({
              user: null,
              profile: null,
              permissions: [],
              isLoading: false,
            });
          }
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
          
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Failed to initialize authentication. Please try again.",
          });
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
