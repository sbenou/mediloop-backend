
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

  // Add debug information directly to the hook
  useEffect(() => {
    if (authData.user && !isLoading) {
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
  }, [authData.user, isLoading, isAuthenticated, userRole, isPharmacist, permissions, authData.profile]);

  // Add a state validation effect
  useEffect(() => {
    if (authData.user && !authData.profile) {
      console.warn('[useAuth][DEBUG] Inconsistent state: user exists but no profile');
      // If we have a user but no profile, try to fetch the profile
      const fetchProfile = async () => {
        try {
          console.log('[useAuth][DEBUG] Attempting to fetch profile for user:', authData.user?.id);
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
            console.error('[useAuth][DEBUG] Error fetching profile:', error);
            return;
          }
          
          if (profile) {
            console.log('[useAuth][DEBUG] Successfully fetched profile for user:', authData.user?.id);
            console.log('[useAuth][DEBUG] Profile details:', {
              id: profile.id,
              role: profile.role,
              fullName: profile.full_name,
            });
            
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
              phone_number: null,
              deleted_at: profile.deleted_at || null,
              created_at: profile.created_at || new Date().toISOString(),
              updated_at: profile.updated_at || new Date().toISOString()
            };
            
            setAuthData(prev => ({ ...prev, profile: completeProfile, isLoading: false }));
          } else {
            console.log('[useAuth][DEBUG] No profile found for user:', authData.user?.id);
            setAuthData(prev => ({ ...prev, isLoading: false }));
          }
        } catch (err) {
          console.error('[useAuth][DEBUG] Error in profile fetch:', err);
          setAuthData(prev => ({ ...prev, isLoading: false }));
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

  // Compute additional role-based properties
  const isDoctorOrPharmacist = useMemo(() => {
    return userRole === 'doctor' || userRole === 'pharmacist' || isPharmacist;
  }, [userRole, isPharmacist]);
  
  const isPatient = useMemo(() => {
    return userRole === 'patient' || userRole === 'user';
  }, [userRole]);

  // User profile context
  const profile = authData.profile;

  return {
    isAuthenticated,
    isLoading,
    userRole,
    profile,
    hasPermission,
    isPharmacist,
    isDoctorOrPharmacist,
    isPatient,
    permissions
  };
};
