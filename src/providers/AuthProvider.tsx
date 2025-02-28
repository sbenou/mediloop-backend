
import { useEffect, useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase, getSessionFromStorage } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { UserProfile, safeQueryResult } from '@/types/user';
import { toast } from '@/components/ui/use-toast';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);

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
      // Explicitly store the session to ensure it persists for all user types
      const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
      
      // Store in localStorage for persistence
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      
      // Also store in sessionStorage for redundancy and for browsers that block localStorage
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      
      console.log('Session explicitly stored for user:', session.user.id);
      console.log('Session storage check in updateAuthState:', 
        window.sessionStorage.getItem(STORAGE_KEY) ? 'Session found in sessionStorage' : 'No session in sessionStorage');

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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setAuth(prev => ({ ...prev, isLoading: true }));
        
        // First check for an existing session in storage
        const storedSession = getSessionFromStorage();
        if (storedSession) {
          console.log('Found session in storage, attempting to use it');
        }
        
        // Then get the current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session?.user?.id || 'No session found');
        
        if (!mounted) return;
        
        if (session) {
          // Ensure session is stored again for all user types
          const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          console.log('Session refreshed in storage during initialization');
          console.log('Session storage check in initializeAuth:', 
            window.sessionStorage.getItem(STORAGE_KEY) ? 'Session found in sessionStorage' : 'No session in sessionStorage');
          
          await updateAuthState(session);
        } else {
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
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

    console.log('Initializing auth provider');
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('Auth state changed:', { event, session: session?.user?.id });

        if (event === 'SIGNED_IN' && session) {
          // Ensure session is stored immediately on sign in for all user types
          const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          console.log('Session stored in storage during SIGNED_IN event');
          console.log('Session storage check in SIGNED_IN:', 
            window.sessionStorage.getItem(STORAGE_KEY) ? 'Session found in sessionStorage' : 'No session in sessionStorage');
          
          await updateAuthState(session);
        } else if (event === 'SIGNED_OUT') {
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Ensure refreshed token is stored properly in all storage types
          const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          console.log('Session stored in storage during TOKEN_REFRESHED event');
          console.log('Session storage check in TOKEN_REFRESHED:', 
            window.sessionStorage.getItem(STORAGE_KEY) ? 'Session found in sessionStorage' : 'No session in sessionStorage');
          
          await updateAuthState(session);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setAuth, updateAuthState]);

  return <>{children}</>;
};

export default AuthProvider;
