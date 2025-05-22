
import { useRecoilValue } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { isAuthenticatedSelector, userRoleSelector, userPermissionsSelector, isLoadingSelector } from '@/store/auth/selectors';
import { PERMISSIONS } from '@/config/permissions';
import { useCallback } from 'react';

export const useAuth = () => {
  const auth = useRecoilValue(authState);
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const userRole = useRecoilValue(userRoleSelector);
  const permissions = useRecoilValue(userPermissionsSelector);
  const isLoading = useRecoilValue(isLoadingSelector);
  
  /**
   * Check if the user has a specific permission
   */
  const hasPermission = useCallback((permission: string) => {
    // Super admins have all permissions
    if (auth.profile?.role === 'superadmin') {
      return true;
    }
    
    // Check if the user has the specific permission
    return permissions.includes(permission);
  }, [permissions, auth.profile]);

  return {
    user: auth.user,
    profile: auth.profile,
    isAuthenticated,
    isLoading,
    userRole,
    permissions,
    hasPermission
  };
};

export default useAuth;
