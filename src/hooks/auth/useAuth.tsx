
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
import { UserProfile } from "@/types/user";

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
          // Use a simplified query that only selects columns we know exist
          const { data: profile, error } = await supabase
            .from('profiles')
            .select(`
              id, role, role_id, full_name, email, 
              avatar_url, auth_method, is_blocked, 
              city, date_of_birth, license_number,
              deleted_at, created_at, updated_at
            `)
            .eq('id', authData.user?.id)
            .maybeSingle();
            
          if (error) {
            console.error('[useAuth] Error fetching profile:', error);
            return;
          }
          
          if (profile) {
            console.log('[useAuth] Successfully fetched profile for user:', authData.user?.id);
            
            // Ensure profile has all required UserProfile properties with default values
            const completeProfile: UserProfile = {
              id: profile.id,
              role: profile.role,
              role_id: profile.role_id || null,
              full_name: profile.full_name || null,
              email: profile.email || null,
              avatar_url: profile.avatar_url || null,
              auth_method: profile.auth_method || null,
              is_blocked: profile.is_blocked || false,
              date_of_birth: profile.date_of_birth || null,
              city: profile.city || null,
              license_number: profile.license_number || null,
              cns_card_front: null,
              cns_card_back: null,
              cns_number: null,
              doctor_stamp_url: null,
              doctor_signature_url: null,
              pharmacist_stamp_url: null,
              pharmacist_signature_url: null,
              pharmacy_id: null,
              pharmacy_name: null,
              pharmacy_logo_url: null,
              deleted_at: profile.deleted_at || null,
              created_at: profile.created_at || new Date().toISOString(),
              updated_at: profile.updated_at || new Date().toISOString()
            };
            
            setAuthData(prev => ({ ...prev, profile: completeProfile }));
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
      // Use a simplified query that only selects columns we know exist
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id, role, role_id, full_name, email, 
          avatar_url, auth_method, is_blocked, 
          city, date_of_birth, license_number,
          deleted_at, created_at, updated_at
        `)
        .eq('id', authData.user.id)
        .maybeSingle();
        
      if (error) {
        console.error('[useAuth] Error refreshing profile:', error);
        return null;
      }
      
      if (profile) {
        // Create a complete profile with default values
        const completeProfile: UserProfile = {
          id: profile.id,
          role: profile.role,
          role_id: profile.role_id || null,
          full_name: profile.full_name || null,
          email: profile.email || null,
          avatar_url: profile.avatar_url || null,
          auth_method: profile.auth_method || null,
          is_blocked: profile.is_blocked || false,
          date_of_birth: profile.date_of_birth || null,
          city: profile.city || null,
          license_number: profile.license_number || null,
          cns_card_front: null,
          cns_card_back: null,
          cns_number: null,
          doctor_stamp_url: null,
          doctor_signature_url: null,
          pharmacist_stamp_url: null,
          pharmacist_signature_url: null,
          pharmacy_id: null,
          pharmacy_name: null,
          pharmacy_logo_url: null,
          deleted_at: profile.deleted_at || null,
          created_at: profile.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString()
        };
        
        setAuthData(prev => ({ ...prev, profile: completeProfile }));
        return completeProfile;
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
