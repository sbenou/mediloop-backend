import { useRecoilValue, useSetRecoilState } from 'recoil';
import { 
  isAuthenticatedSelector, 
  userRoleSelector, 
  userPermissionsSelector,
  isLoadingSelector 
} from '@/store/auth/selectors';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { toast } from '@/components/ui/use-toast';
import { UserProfile } from '@/types/user';

export const useAuth = () => {
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const userRole = useRecoilValue(userRoleSelector);
  const permissions = useRecoilValue(userPermissionsSelector);
  const isLoading = useRecoilValue(isLoadingSelector);
  const setAuth = useSetRecoilState(authState);

  useEffect(() => {
    const fetchUserData = async (userId: string) => {
      try {
        const [profileResponse, permissionsResponse] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single(),
          supabase
            .from('role_permissions')
            .select('permission_id')
            .eq('role_id', userId)
        ]);

        if (profileResponse.error) {
          console.error('Profile fetch error:', profileResponse.error);
          throw profileResponse.error;
        }

        if (permissionsResponse.error) {
          console.error('Permissions fetch error:', permissionsResponse.error);
          throw permissionsResponse.error;
        }

        return {
          profile: profileResponse.data as UserProfile,
          permissions: permissionsResponse.data?.map(p => p.permission_id) || []
        };
      } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
      }
    };

    const checkSession = async () => {
      try {
        setAuth(state => ({ ...state, isLoading: true }));
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          throw error;
        }
        
        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          setAuth({
            user: session.user,
            profile: userData.profile,
            permissions: userData.permissions,
            isLoading: false,
          });
        } else {
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, session: session?.user?.id });
      
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = await fetchUserData(session.user.id);
          setAuth({
            user: session.user,
            profile: userData.profile,
            permissions: userData.permissions,
            isLoading: false,
          });

          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
        } else if (event === 'SIGNED_OUT') {
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setAuth]);

  return {
    isAuthenticated,
    userRole,
    permissions,
    isLoading,
    hasPermission: (permission: string) => permissions.includes(permission),
  };
};