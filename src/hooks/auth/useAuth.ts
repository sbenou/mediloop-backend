
import { useRecoilValue } from 'recoil';
import { useMemo, useEffect } from 'react';
import { 
  isAuthenticatedSelector, 
  userRoleSelector, 
  userPermissionsSelector,
  isLoadingSelector 
} from '@/store/auth/selectors';
import { authState } from '@/store/auth/atoms';
import { supabase, getSessionFromStorage } from '@/lib/supabase';

export const useAuth = () => {
  // Get all state values first
  const auth = useRecoilValue(authState);
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const userRole = useRecoilValue(userRoleSelector);
  const permissions = useRecoilValue(userPermissionsSelector);
  const isLoading = useRecoilValue(isLoadingSelector);
  
  // Extra check to ensure we have a session when auth claims we're authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Verify that we actually have a session
      const checkSessionExists = async () => {
        // Check from storage first (faster)
        const storedSession = getSessionFromStorage();
        
        if (!storedSession) {
          // If not in storage, check from Supabase
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            console.warn('Auth state claims user is authenticated but no session exists');
          }
        }
      };
      
      checkSessionExists();
    }
  }, [isAuthenticated, isLoading]);

  // Memoize all values together to prevent unnecessary re-renders
  const memoizedValues = useMemo(() => ({
    profile: auth.profile,
    user: auth.user,
    hasPermission: (permission: string) => isLoading || permissions.includes(permission),
  }), [auth.profile, auth.user, isLoading, permissions]);

  return {
    isAuthenticated,
    userRole,
    permissions,
    isLoading,
    hasPermission: memoizedValues.hasPermission,
    user: memoizedValues.user,
    profile: memoizedValues.profile,
  };
};
