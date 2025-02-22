import { useEffect, useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase } from '@/lib/supabase';
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

      const permissions = (data ?? []).map(rp => rp.permission_id);
      return permissions;
    } catch (error) {
      console.error('Error in fetchUserPermissions:', error);
      return [];
    }
  }, []);

  const fetchAndSetProfile = useCallback(async (userId: string): Promise<{ profile: UserProfile | null; permissions: string[] }> => {
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
        .single();

      if (error || !profile) {
        console.error('Profile fetch error:', error);
        return { profile: null, permissions: [] };
      }

      const safeProfile = safeQueryResult<UserProfile>(profile);
      const permissions = safeProfile?.role_id 
        ? await fetchUserPermissions(safeProfile.role_id)
        : [];

      return { 
        profile: safeProfile,
        permissions
      };
    } catch (error) {
      console.error('Error in fetchAndSetProfile:', error);
      return { profile: null, permissions: [] };
    }
  }, [fetchUserPermissions]);

  const updateAuthState = useCallback(async (session: any | null, shouldToast: boolean = false) => {
    if (!session?.user) {
      setAuth({
        user: null,
        profile: null,
        permissions: [],
        isLoading: false,
      });
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
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
        return;
      }

      setAuth({
        user: session.user,
        profile,
        permissions,
        isLoading: false,
      });

      if (shouldToast) {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    } catch (error) {
      console.error('Error in updateAuthState:', error);
      setAuth({
        user: null,
        profile: null,
        permissions: [],
        isLoading: false,
      });
    }
  }, [fetchAndSetProfile, setAuth]);

  useEffect(() => {
    let mounted = true;

    setAuth(prev => ({ ...prev, isLoading: true }));
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session) {
          await updateAuthState(session, false);
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
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        switch (event) {
          case 'SIGNED_IN':
            await updateAuthState(session, true);
            break;
          
          case 'SIGNED_OUT':
            setAuth({
              user: null,
              profile: null,
              permissions: [],
              isLoading: false,
            });
            break;
          
          case 'USER_UPDATED':
          case 'TOKEN_REFRESHED':
            if (session) {
              await updateAuthState(session, false);
            }
            break;
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
