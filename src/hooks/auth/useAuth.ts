
import { useRecoilValue } from 'recoil';
import { useMemo } from 'react';
import { 
  isAuthenticatedSelector, 
  userRoleSelector, 
  userPermissionsSelector,
  isLoadingSelector 
} from '@/store/auth/selectors';
import { authState } from '@/store/auth/atoms';

export const useAuth = () => {
  // Get all state values first
  const auth = useRecoilValue(authState);
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const userRole = useRecoilValue(userRoleSelector);
  const permissions = useRecoilValue(userPermissionsSelector);
  const isLoading = useRecoilValue(isLoadingSelector);

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
