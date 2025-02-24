
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
  return useMemo(() => ({
    isAuthenticated,
    userRole,
    permissions,
    isLoading,
    hasPermission: (permission: string) => permissions.includes(permission),
    user: auth.user,
    profile: auth.profile,
  }), [
    isAuthenticated,
    userRole,
    permissions,
    isLoading,
    auth.user,
    auth.profile
  ]);
};
