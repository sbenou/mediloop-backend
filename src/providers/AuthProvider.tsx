
import { useEffect, useCallback, useRef } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase, getSessionFromStorage } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { UserProfile, safeQueryResult } from '@/types/user';
import { toast } from '@/components/ui/use-toast';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);
  const sessionPollingRef = useRef<number | null>(null);

  const fetchUserPermissions = useCallback(async (roleId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          permission_id,
          permissions (id, name)
        `)
        .eq('role_id', roleId);

      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }

      return (data ?? []).map(rp => rp.permission_id);
    } catch (error) {
      console.error('Error in fetchUserPermissions:', error);
      return [];
    }
  }, []);

  const fetchAndSetProfile = useCallback(async (userId: string): Promise<{ profile: UserProfile | null; permissions: string[] }> => {
    console.log('Starting profile fetch for user:', userId);
    try {
      setAuth(prev => ({ ...prev, isLoading: true }));

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          role_id,
          full_name,
          email,
          avatar_url,
          auth_method,
          is_blocked,
          city,
          date_of_birth,
          license_number,
          cns_card_front,
          cns_card_back,
          cns_number,
          doctor_stamp_url,
          doctor_signature_url,
          deleted_at,
          created_at,
          updated_at
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        return { profile: null, permissions: [] };
      }

      const safeProfile = safeQueryResult<UserProfile>(profile);
      if (!safeProfile) {
        console.error('No profile found for user:', userId);
        return { profile: null, permissions: [] };
      }

      const permissions = safeProfile.role_id 
        ? await fetchUserPermissions(safeProfile.role_id)
        : [];

      console.log('Profile and permissions fetched:', { 
        profileId: safeProfile.id, 
        role: safeProfile.role,
        permissionsCount: permissions.length 
      });

      return { profile: safeProfile, permissions };
    } catch (error) {
      console.error('Error in fetchAndSetProfile:', error);
      return { profile: null, permissions: [] };
    }
  }, [fetchUserPermissions]);

  const updateAuthState = useCallback(async (session: any | null) => {
    if (!session?.user) {
      console.log('No session or user, clearing auth state');
      setAuth({
        user: null,
        profile: null,
        permissions: [],
        isLoading: false,
      });
      return;
    }

    try {
      const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
      
      // Ensure session is stored in both localStorage and sessionStorage for maximum persistence
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        console.log(`Session explicitly stored for user: ${session.user.id}`);
      } catch (storageError) {
        console.error('Error storing session in storage:', storageError);
      }
      
      setAuth(prev => ({
        ...prev,
        user: session.user,
        isLoading: true,
      }));

      const { profile, permissions } = await fetchAndSetProfile(session.user.id);

      if (!profile) {
        console.error('No profile found after fetch, clearing auth state');
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
        return;
      }

      console.log('Updating auth state with:', {
        userId: session.user.id,
        role: profile.role,
        permissionsCount: permissions.length
      });

      setAuth({
        user: session.user,
        profile,
        permissions,
        isLoading: false,
      });

    } catch (error) {
      console.error('Error in updateAuthState:', error);
      setAuth({
        user: null,
        profile: null,
        permissions: [],
        isLoading: false,
      });
      
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "There was an error loading your profile. Please try logging in again.",
      });
    }
  }, [fetchAndSetProfile, setAuth]);

  // Set up continuous session polling
  useEffect(() => {
    // Clear any existing interval first
    if (sessionPollingRef.current) {
      window.clearInterval(sessionPollingRef.current);
    }
    
    // Poll every 30 seconds to ensure session is still valid
    sessionPollingRef.current = window.setInterval(async () => {
      try {
        // Only poll when tab is visible
        if (document.visibilityState === 'visible') {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error polling session:', error);
            return;
          }
          
          if (session) {
            // If we got a session, make sure it's stored correctly
            const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
            try {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
              window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
            } catch (storageError) {
              console.error('Error updating session in polling:', storageError);
            }
          }
        }
      } catch (error) {
        console.error('Error in session polling:', error);
      }
    }, 30000); // 30 seconds
    
    return () => {
      if (sessionPollingRef.current) {
        window.clearInterval(sessionPollingRef.current);
        sessionPollingRef.current = null;
      }
    };
  }, []);

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

    // Listen for auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log(`Auth state changed: ${event}, user: ${session?.user?.id || 'none'}`);

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
    const handleStorageChange = (e: StorageEvent) => {
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
          } else if (event.type === 'LOGIN' && mounted) {
            console.log("Login detected in another tab");
            // Force refresh the session
            supabase.auth.getSession().then(({ data }) => {
              if (data.session) {
                updateAuthState(data.session);
              }
            });
          } else if (event.type === 'TOKEN_REFRESHED' && mounted) {
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
    };
    
    window.addEventListener('storage', handleStorageChange);

    // Listen for visibility changes
    const handleVisibilityChange = async () => {
      if (!mounted) return;
      
      if (document.visibilityState === 'visible') {
        console.log("Tab became visible, checking auth state");
        
        try {
          // Get current auth state
          const currentUserState = getSessionFromStorage()?.user?.id;
          
          // Get fresh session from API
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error getting session on visibility change:", error);
            return;
          }
          
          // If API session differs from our state, update it
          const newUserState = session?.user?.id;
          
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
            updateAuthState(session);
          } else if (newUserState && currentUserState === newUserState) {
            // Same user, ensure the session is fully loaded
            console.log("Same user, ensuring session is fully loaded");
            
            const { profile: cachedProfile } = await fetchAndSetProfile(newUserState);
            if (!cachedProfile) {
              // If profile couldn't be loaded, try refreshing the session
              const { data: refreshData } = await supabase.auth.refreshSession();
              if (refreshData.session) {
                updateAuthState(refreshData.session);
              }
            }
          }
        } catch (err) {
          console.error("Error during visibility change auth check:", err);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up all listeners on unmount
    return () => {
      mounted = false;
      subscription?.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setAuth, updateAuthState, fetchAndSetProfile]);

  // Listen for custom auth token update events
  useEffect(() => {
    const handleTokenUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('Received token update event:', customEvent.detail);
      
      // Force a session check
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          updateAuthState(data.session);
        }
      });
    };
    
    window.addEventListener('supabase:auth:token:update', handleTokenUpdate);
    
    return () => {
      window.removeEventListener('supabase:auth:token:update', handleTokenUpdate);
    };
  }, [updateAuthState]);

  return <>{children}</>;
};

export default AuthProvider;
