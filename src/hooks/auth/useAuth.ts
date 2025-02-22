
import { useRecoilValue, useRecoilCallback } from 'recoil';
import { useMemo, useCallback } from 'react';
import { 
  isAuthenticatedSelector, 
  userRoleSelector, 
  userPermissionsSelector,
  isLoadingSelector 
} from '@/store/auth/selectors';
import { authState } from '@/store/auth/atoms';

export const useAuth = () => {
  const auth = useRecoilValue(authState);
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const userRole = useRecoilValue(userRoleSelector);
  const permissions = useRecoilValue(userPermissionsSelector);
  const isLoading = useRecoilValue(isLoadingSelector);

  // Memoize profile to prevent unnecessary re-renders
  const profile = useMemo(() => auth.profile, [auth.profile]);
  
  // Memoize user to prevent unnecessary re-renders
  const user = useMemo(() => auth.user, [auth.user]);

  // Memoize hasPermission function
  const hasPermission = useCallback((permission: string) => 
    isLoading || permissions.includes(permission),
    [isLoading, permissions]
  );

  return {
    isAuthenticated,
    userRole,
    permissions,
    isLoading,
    hasPermission,
    user,
    profile,
  };
};
