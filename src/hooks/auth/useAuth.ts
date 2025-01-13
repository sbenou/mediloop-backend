import { useRecoilValue } from 'recoil';
import { 
  isAuthenticatedSelector, 
  userRoleSelector, 
  userPermissionsSelector,
  isLoadingSelector 
} from '@/store/auth/selectors';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useAuth = () => {
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const userRole = useRecoilValue(userRoleSelector);
  const permissions = useRecoilValue(userPermissionsSelector);
  const isLoading = useRecoilValue(isLoadingSelector);

  useEffect(() => {
    // Check session on mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('useAuth - Session check:', session);
    };
    
    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('useAuth - Auth state changed:', event, session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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