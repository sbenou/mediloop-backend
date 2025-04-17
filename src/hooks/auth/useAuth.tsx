
import { useCallback, useEffect, useMemo } from "react";
import { useRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";
import { 
  isAuthenticatedSelector, 
  userRoleSelector, 
  userPermissionsSelector,
  isLoadingSelector,
  isPharmacistSelector
} from "@/store/auth/selectors";
import { useRecoilValue } from "recoil";
import { supabase } from "@/lib/supabase";

/**
 * Hook for accessing and managing authentication state
 * Provides authentication status, user roles, permissions,
 * and utility functions for permission checks
 */
export const useAuth = () => {
  const [authData, setAuthData] = useRecoilState(authState);
  
  // Use selectors for derived state
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const userRole = useRecoilValue(userRoleSelector);
  const permissions = useRecoilValue(userPermissionsSelector);
  const isLoading = useRecoilValue(isLoadingSelector);
  const isPharmacist = useRecoilValue(isPharmacistSelector);
  
  // Add debug logging
  useEffect(() => {
    console.log("[useAuth] Auth state changed:", { 
      isAuthenticated, 
      userRole,
      isPharmacist, 
      profileRole: authData.profile?.role,
      hasUser: !!authData.user,
      hasProfile: !!authData.profile,
      isLoading
    });
  }, [isAuthenticated, userRole, isPharmacist, authData.profile, authData.user, isLoading]);

  // Utility function to check if the user has a specific permission
  const hasPermission = useCallback((permission: string) => {
    // During loading, don't make definitive permission decisions
    if (isLoading) return false;
    
    // Check if the permission exists in the user's permissions array
    return permissions.includes(permission);
  }, [permissions, isLoading]);
  
  // Function to refresh the session (can be called after login/signup)
  const refreshSession = useCallback(async () => {
    try {
      console.log("[useAuth] Manually refreshing session");
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        console.log("[useAuth] Session refreshed successfully");
      } else {
        console.log("[useAuth] No session found during refresh");
      }
      return data?.session;
    } catch (error) {
      console.error("[useAuth] Error refreshing session:", error);
    }
  }, []);

  // Return the auth state and utility functions
  return {
    isAuthenticated,
    userRole,
    permissions,
    isLoading,
    hasPermission,
    user: authData.user,
    profile: authData.profile,
    refreshSession,
    isPharmacist
  };
};

export default useAuth;
