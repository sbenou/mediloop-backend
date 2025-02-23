
import { useEffect, useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { UserProfile, safeQueryResult } from '@/types/user';
import { toast } from '@/components/ui/use-toast';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);

  const clearAuthState = useCallback(() => {
    console.log('Clearing auth state');
    setAuth({
      user: null,
      profile: null,
      permissions: [],
      isLoading: false,
    });
  }, [setAuth]);

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
    console.log('Updating auth state with session:', session?.user?.id);
    
    if (!session?.user) {
      console.log('No session or user, clearing auth state');
      clearAuthState();
      return;
    }

    try {
      setAuth(prev => ({
        ...prev,
        user: session.user,
        isLoading: true,
      }));

      const { profile, permissions } = await fetchAndSetProfile(session.user.id);

      if (!profile) {
        console.error('No profile found after fetch, clearing auth state');
        clearAuthState();
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
      clearAuthState();
      
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "There was an error loading your profile. Please try logging in again.",
      });
    }
  }, [fetchAndSetProfile, setAuth, clearAuthState]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setAuth(prev => ({ ...prev, isLoading: true }));
        
        // Check for existing session in storage first
        const existingSession = localStorage.getItem('sb-' + supabase.supabaseUrl);
        if (existingSession) {
          const { currentSession } = JSON.parse(existingSession);
          if (currentSession && mounted) {
            await updateAuthState(currentSession);
            return;
          }
        }

        // If no stored session, check current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session fetch error:', error);
          if (mounted) clearAuthState();
          return;
        }

        if (mounted) {
          if (session) {
            await updateAuthState(session);
          } else {
            clearAuthState();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) clearAuthState();
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', { event, session: session?.user?.id });

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await updateAuthState(session);
      } else if (event === 'SIGNED_OUT') {
        clearAuthState();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [updateAuthState, setAuth, clearAuthState]);

  return <>{children}</>;
};

export default AuthProvider;
