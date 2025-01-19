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
    // Check session on mount
    const checkSession = async () => {
      try {
        setAuth(state => ({ ...state, isLoading: true }));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('useAuth - Session check:', session);
        
        if (error) {
          console.error('Session check error:', error);
          throw error;
        }
        
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            throw profileError;
          }

          const { data: permissions, error: permissionsError } = await supabase
            .from('role_permissions')
            .select('permission_id')
            .eq('role_id', profile?.role_id);

          if (permissionsError) {
            console.error('Permissions fetch error:', permissionsError);
            throw permissionsError;
          }

          setAuth({
            user: session.user,
            profile: profile as UserProfile,
            permissions: permissions?.map(p => p.permission_id) || [],
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

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('useAuth - Auth state changed:', event, session);
      
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;

          const { data: permissions, error: permissionsError } = await supabase
            .from('role_permissions')
            .select('permission_id')
            .eq('role_id', profile?.role_id);

          if (permissionsError) throw permissionsError;

          setAuth({
            user: session.user,
            profile: profile as UserProfile,
            permissions: permissions?.map(p => p.permission_id) || [],
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
        console.error('Auth state change error:', error);
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

  console.log('useAuth hook - State:', { 
    isAuthenticated, 
    userRole, 
    permissions, 
    isLoading 
  });

  return {
    isAuthenticated,
    userRole,
    permissions,
    isLoading,
    hasPermission: (permission: string) => permissions.includes(permission),
  };
};