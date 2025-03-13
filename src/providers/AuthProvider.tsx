
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
  
  // Set up session polling
  useSessionPolling();

  // Listen for auth state changes from Supabase
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth provider...');
        setAuth(prev => ({ ...prev, isLoading: true }));
        
        // First try to get session from storage (faster)
        const storedSession = getSessionFromStorage();
        
        if (storedSession) {
          console.log('Found existing session in storage, using it temporarily');
          // Temporarily set auth state with stored session while we validate
          if (mounted) {
            setAuth(prev => ({
              ...prev,
              user: storedSession.user,
              isLoading: true,
            }));
          }
        }
        
        // Always get fresh session from API to validate
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session from API:', error);
          throw error;
        }
        
        if (!mounted) return;
        
        if (session) {
          console.log(`Using API session for user: ${session.user.id}`);
          await updateAuthState(session);
        } else if (storedSession?.user?.id) {
          console.log('API returned no session but we have one in storage');
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
          console.log('No active session found, clearing auth state');
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
        console.error('Auth initialization error:', error);
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

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log(`Auth state changed: ${event} for user: ${session?.user?.id || 'none'}`);

        if (event === 'SIGNED_IN' && session) {
          await updateAuthState(session);
        } else if (event === 'SIGNED_OUT') {
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        } else if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session) {
          await updateAuthState(session);
        }
      }
    );
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up all listeners on unmount
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
