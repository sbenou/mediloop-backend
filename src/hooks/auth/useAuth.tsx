
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
import { toast } from '@/components/ui/use-toast';

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
  
  // Compute additional role-based properties
  const isDoctorOrPharmacist = useMemo(() => {
    return userRole === 'doctor' || userRole === 'pharmacist' || isPharmacist;
  }, [userRole, isPharmacist]);
  
  const isPatient = useMemo(() => {
    return userRole === 'patient' || userRole === 'user';
  }, [userRole]);
  
  // Manual profile fetch function for cases where profile is missing
  const fetchProfileManually = useCallback(async () => {
    if (!authData.user?.id) return;
    
    try {
      console.log("[useAuth][DEBUG] Attempting to manually fetch profile");
      
      // Implementation kept simple to avoid errors
      toast({
        title: "Refreshing profile",
        description: "Attempting to load your profile data...",
      });
      
      // Force a page reload to refresh the auth state properly
      window.location.reload();
      
    } catch (err) {
      console.error("[useAuth][DEBUG] Error during manual profile fetch:", err);
    }
  }, [authData.user?.id]);
  
  // Add debug information
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
    fetchProfileManually,
  };
};

export default useAuth;
