
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { UserProfile } from '@/types/user';
import { toast } from '@/components/ui/use-toast';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);

  const fetchUserPermissions = async (roleId: string): Promise<string[]> => {
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

      const permissions = data.map(rp => rp.permission_id);
      console.log('Fetched permissions:', permissions);
      return permissions;
    } catch (error) {
      console.error('Error in fetchUserPermissions:', error);
      return [];
    }
  };

  const fetchAndSetProfile = async (userId: string): Promise<UserProfile | null> => {
    console.log('Starting profile fetch for user:', userId);
    try {
      console.log('Fetching profile data...');
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
        throw error;
      }

      if (!profile) {
        console.error('No profile found for user:', userId);
        return null;
      }

      console.log('Profile data received:', {
        id: profile.id,
        role: profile.role,
        avatar_url: profile.avatar_url
      });
      return profile;
    } catch (error) {
      console.error('Error in fetchAndSetProfile:', error);
      throw error;
    }
  };

  const updateAuthState = async (session: any | null) => {
    console.log('Updating auth state with session:', session?.user?.id);
    
    try {
      if (!session?.user) {
        console.log('No session, clearing auth state');
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
        return;
      }

      // Set loading state before fetching profile
      setAuth(state => ({ ...state, isLoading: true }));
      
      console.log('Fetching profile for user:', session.user.id);
      const profile = await fetchAndSetProfile(session.user.id);
      
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

      // Fetch permissions if we have a role_id
      const permissions = profile.role_id 
        ? await fetchUserPermissions(profile.role_id)
        : [];

      console.log('Setting final auth state with profile:', {
        userId: profile.id,
        role: profile.role,
        permissions: permissions.length
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
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('Initializing auth...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Got session:', session?.user?.id);
        
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
        console.log('Auth state change:', event, session?.user?.id);

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
            } else {
              setAuth(state => ({
                ...state,
                isLoading: false
              }));
            }
        }
      }
    );

    return () => {
      console.log('Cleaning up AuthProvider');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setAuth]);

  return <>{children}</>;
};

export default AuthProvider;
