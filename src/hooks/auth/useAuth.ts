
import { useRecoilValue } from 'recoil';
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

  return {
    isAuthenticated,
    userRole,
    permissions,
    isLoading,
    // Consider the user having permission if we're still loading
    hasPermission: (permission: string) => 
      isLoading || permissions.includes(permission),
    user: auth.user,
    profile: auth.profile,
  };
};
