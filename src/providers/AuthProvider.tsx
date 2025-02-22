
import { useEffect, useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { UserProfile } from '@/types/user';
import { toast } from '@/components/ui/use-toast';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);

  const fetchUserPermissions = useCallback(async (roleId: string): Promise<string[]> => {
    console.log('Fetching permissions for role:', roleId);
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);

      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }

      return data.map(rp => rp.permission_id);
    } catch (error) {
      console.error('Error in fetchUserPermissions:', error);
      return [];
    }
  }, []);

  const fetchAndSetProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
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
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error in fetchAndSetProfile:', error);
      return null;
    }
  }, []);

  const updateAuthState = useCallback(async (session: any | null) => {
    try {
      if (!session?.user) {
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
        return;
      }

      const profile = await fetchAndSetProfile(session.user.id);
      
      if (!profile) {
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
        return;
      }

      const permissions = profile.role_id 
        ? await fetchUserPermissions(profile.role_id)
        : [];

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
    }
  }, [fetchAndSetProfile, fetchUserPermissions, setAuth]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          setAuth(state => ({ ...state, isLoading: true }));
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
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        switch (event) {
          case 'SIGNED_IN':
            setAuth(state => ({ ...state, isLoading: true }));
            await updateAuthState(session);
            toast({
              title: "Welcome back!",
              description: "You have successfully signed in.",
            });
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
            if (session) {
              await updateAuthState(session);
            }
            break;
          
          default:
            if (session) {
              await updateAuthState(session);
            }
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
