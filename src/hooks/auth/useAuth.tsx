
import { useRecoilValue } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { 
  isAuthenticatedSelector, 
  userRoleSelector, 
  userPermissionsSelector,
  isLoadingSelector,
  isPharmacistSelector
} from '@/store/auth/selectors';
import { useCallback } from 'react';

/**
 * Hook for accessing and managing authentication state
 * Provides authentication status, user roles, permissions,
 * and utility functions for permission checks
 */
export const useAuth = () => {
  // Use selectors for derived state - these must be called unconditionally
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const userRole = useRecoilValue(userRoleSelector);
  const permissions = useRecoilValue(userPermissionsSelector);
  const isLoading = useRecoilValue(isLoadingSelector);
  const isPharmacist = useRecoilValue(isPharmacistSelector);
  
  // Access the raw auth state for updates
  const authData = useRecoilValue(authState);
  
  // All hooks must be called unconditionally
  const hasPermission = useCallback((permission: string) => {
    if (isLoading) return false;
    return permissions.includes(permission);
  }, [permissions, isLoading]);
  
  return {
    isAuthenticated,
    isLoading,
    user: authData.user,
    profile: authData.profile,
    userRole,
    isPharmacist,
    permissions,
    hasPermission,
  };
};

export default useAuth;
