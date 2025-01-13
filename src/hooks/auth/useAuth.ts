import { useRecoilValue } from 'recoil';
import { 
  isAuthenticatedSelector, 
  userRoleSelector, 
  userPermissionsSelector,
  isLoadingSelector 
} from '@/store/auth/selectors';

export const useAuth = () => {
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const userRole = useRecoilValue(userRoleSelector);
  const permissions = useRecoilValue(userPermissionsSelector);
  const isLoading = useRecoilValue(isLoadingSelector);

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