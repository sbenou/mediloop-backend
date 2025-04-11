
import { useRecoilValue } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { 
  isAuthenticatedSelector, 
  userRoleSelector, 
  userPermissionsSelector,
  isLoadingSelector,
  isPharmacistSelector
} from '@/store/auth/selectors';
import { useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { UserProfile } from '@/types/user';

/**
 * Hook for accessing and managing authentication state
 * Provides authentication status, user roles, permissions,
 * and utility functions for permission checks
 */
export const useAuth = () => {
  // Use selectors for derived state
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const userRole = useRecoilValue(userRoleSelector);
  const permissions = useRecoilValue(userPermissionsSelector);
  const isLoading = useRecoilValue(isLoadingSelector);
  const isPharmacist = useRecoilValue(isPharmacistSelector);
  
  // Access the raw auth state for updates
  const authData = useRecoilValue(authState);
  
  // IMPORTANT: All hooks must be called unconditionally
  // Define this outside of any conditions to avoid the "rendered more hooks" error
  const hasPermission = useCallback((permission: string) => {
    if (isLoading) return false;
    return permissions.includes(permission);
  }, [permissions, isLoading]);
  
  // Compute additional role-based properties
  const isDoctorOrPharmacist = useMemo(() => {
    return userRole === 'doctor' || userRole === 'pharmacist' || isPharmacist;
  }, [userRole, isPharmacist]);
  
  const isPatient = useMemo(() => {
    return userRole === 'patient' || userRole === 'user';
  }, [userRole]);
  
  // Add debug information (always run this effect regardless of auth state)
  useEffect(() => {
    if (authData.user) {
      console.log(`[useAuth][DEBUG] Current auth state:`, {
        isAuthenticated,
        userRole,
        isPharmacist,
        userId: authData.user?.id,
        profileId: authData.profile?.id,
        email: authData.user?.email,
        profileRole: authData.profile?.role,
        permissionsCount: permissions.length
      });
    }
  }, [authData.user, authData.profile, isAuthenticated, userRole, isPharmacist, permissions]);
  
  return {
    isAuthenticated,
    isLoading,
    user: authData.user,
    profile: authData.profile,
    userRole,
    isPharmacist,
    isDoctorOrPharmacist,
    isPatient,
    permissions,
    hasPermission,
  };
};

export default useAuth;
