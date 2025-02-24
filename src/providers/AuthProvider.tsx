
import { useEffect, useCallback, useRef } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { UserProfile, safeQueryResult } from '@/types/user';
import { toast } from '@/components/ui/use-toast';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);
  const authInProgress = useRef(false);
  const currentUserId = useRef<string | null>(null);

  const clearAuthState = useCallback(() => {
    console.log('Clearing auth state');
    currentUserId.current = null;
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
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

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

      return { profile: safeProfile, permissions };
    } catch (error) {
      console.error('Error in fetchAndSetProfile:', error);
      return { profile: null, permissions: [] };
    }
  }, [fetchUserPermissions]);

  const updateAuthState = useCallback(async (session: any | null) => {
    if (authInProgress.current) {
      console.log('Auth update already in progress, skipping');
      return;
    }

    if (!session?.user) {
      if (currentUserId.current) {
        console.log('Session expired, clearing auth state');
        clearAuthState();
      }
      return;
    }

    // Skip if this is the same user we're already processing
    if (currentUserId.current === session.user.id) {
      console.log('User already authenticated, skipping update');
      return;
    }

    try {
      authInProgress.current = true;
      currentUserId.current = session.user.id;

      setAuth(prev => ({
        ...prev,
        isLoading: true,
      }));

      const { profile, permissions } = await fetchAndSetProfile(session.user.id);

      if (!profile) {
        console.error('No profile found after fetch, clearing auth state');
        clearAuthState();
        return;
      }

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
    } finally {
      authInProgress.current = false;
    }
  }, [fetchAndSetProfile, setAuth, clearAuthState]);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session fetch error:', error);
        clearAuthState();
        return;
      }

      if (session) {
        await updateAuthState(session);
      } else {
        clearAuthState();
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, sessionId: session?.user?.id });

      switch (event) {
        case 'SIGNED_IN':
          await updateAuthState(session);
          break;
        case 'SIGNED_OUT':
          clearAuthState();
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [updateAuthState, clearAuthState]);

  return <>{children}</>;
};

export default AuthProvider;
