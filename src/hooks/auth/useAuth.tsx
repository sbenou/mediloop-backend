
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
import { toast } from "@/components/ui/use-toast";

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

  // Add a state validation effect
  useEffect(() => {
    if (authData.user && !authData.profile) {
      console.warn('[useAuth] Inconsistent state: user exists but no profile');
      // If we have a user but no profile, try to fetch the profile
      const fetchProfile = async () => {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user?.id)
            .single();
            
          if (error) {
            console.error('[useAuth] Error fetching profile:', error);
            return;
          }
          
          if (profile) {
            console.log('[useAuth] Successfully fetched profile for user:', authData.user?.id);
            setAuthData(prev => ({ ...prev, profile }));
          }
        } catch (err) {
          console.error('[useAuth] Error in profile fetch:', err);
        }
      };
      
      fetchProfile();
    }
  }, [authData.user, authData.profile, setAuthData]);

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
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        // Refresh user data here if needed
        console.log("Session refreshed successfully");
        return data.session;
      }
      return null;
    } catch (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
  }, []);
  
  // Function to force a profile refresh
  const refreshProfile = useCallback(async () => {
    if (!authData.user?.id) {
      console.warn('[useAuth] Cannot refresh profile: no user ID');
      return null;
    }
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      if (error) {
        console.error('[useAuth] Error refreshing profile:', error);
        return null;
      }
      
      if (profile) {
        setAuthData(prev => ({ ...prev, profile }));
        return profile;
      }
      
      return null;
    } catch (err) {
      console.error('[useAuth] Error in profile refresh:', err);
      return null;
    }
  }, [authData.user?.id, setAuthData]);

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
    refreshProfile,
    isPharmacist
  };
};
