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

export const useAuth = () => {
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const userRole = useRecoilValue(userRoleSelector);
  const permissions = useRecoilValue(userPermissionsSelector);
  const isLoading = useRecoilValue(isLoadingSelector);
  const setAuth = useSetRecoilState(authState);

  useEffect(() => {
    // Check session on mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('useAuth - Session check:', session);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setAuth({
          user: session.user,
          profile,
          permissions: [],
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
    };
    
    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('useAuth - Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setAuth({
          user: session.user,
          profile,
          permissions: [],
          isLoading: false,
        });

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
      
      if (event === 'SIGNED_OUT') {
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