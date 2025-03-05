
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
      console.log(`Session available for user: ${session.user.id}`);

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
        console.log('Initializing auth provider...');
        setAuth(prev => ({ ...prev, isLoading: true }));
        
        // First try to get session from storage (faster)
        const storedSession = getSessionFromStorage();
        if (storedSession) {
          console.log('Found existing session in storage');
          if (mounted) {
            // Use the stored session while we validate with the API
            updateAuthState(storedSession);
          }
        }
        
        // Then validate with API (might take longer)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session) {
          console.log(`Using session for user: ${session.user.id}`);
          await updateAuthState(session);
        } else if (!storedSession) { 
          // Only clear if we didn't find a session in storage
          console.log('No active session found, clearing auth state');
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

    initializeAuth();

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

    // Listen for storage events that might indicate auth changes in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('auth-token') && mounted) {
        console.log('Auth token changed in storage, refreshing auth state');
        initializeAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setAuth, updateAuthState]);

  return <>{children}</>;
};

export default AuthProvider;
