
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile, safeQueryResult } from '@/types/user';

// Define fetchUserPermissions function directly here if it's missing from sessionUtils
const fetchUserPermissions = async (roleId: string): Promise<string[]> => {
  try {
    console.log("[fetchUserPermissions][DEBUG] Fetching permissions for role:", roleId);
    
    if (!roleId) {
      console.log("[fetchUserPermissions][DEBUG] No role ID provided, returning empty permissions array");
      return [];
    }
    
    // Fetch permissions from role_permissions table
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', roleId);
      
    if (error) {
      console.error("[fetchUserPermissions][DEBUG] Error fetching permissions:", error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log("[fetchUserPermissions][DEBUG] No permissions found for role:", roleId);
      return [];
    }
    
    // Extract permission IDs from the result
    const permissions = data.map(item => item.permission_id);
    
    console.log(`[fetchUserPermissions][DEBUG] Found ${permissions.length} permissions for role ${roleId}`);
    
    return permissions;
  } catch (error) {
    console.error("[fetchUserPermissions][DEBUG] Exception in fetchUserPermissions:", error);
    return [];
  }
};

export const useProfileFetch = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAndSetProfile = useCallback(async (userId: string): Promise<{ profile: UserProfile | null; permissions: string[] }> => {
    console.log('[ProfileFetch][DEBUG] Starting profile fetch for user:', userId);
    try {
      setIsLoading(true);

      // Fetch user profile with simplified approach
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')  // Select all fields
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('[ProfileFetch][DEBUG] Profile fetch error:', error);
          return { profile: null, permissions: [] };
        }

        if (!profile) {
          console.log('[ProfileFetch][DEBUG] No profile found for user:', userId);
          return { profile: null, permissions: [] };
        }

        console.log('[ProfileFetch][DEBUG] Profile fetched successfully:', { 
          role: profile.role,
          hasPharmacistFields: !!profile.pharmacist_stamp_url
        });

        // Ensure the profile object has all required properties
        const completeProfile: UserProfile = {
          ...profile as any,
          // Make sure these fields exist even if they're null
          pharmacist_stamp_url: profile.pharmacist_stamp_url || null,
          pharmacist_signature_url: profile.pharmacist_signature_url || null,
          pharmacy_id: profile.pharmacy_id || null
        };

        const safeProfile = safeQueryResult<UserProfile>(completeProfile);
        if (!safeProfile) {
          console.error('[ProfileFetch][DEBUG] Failed to process profile data');
          return { profile: null, permissions: [] };
        }

        // Get permissions if we have a role_id
        const permissions = safeProfile.role_id 
          ? await fetchUserPermissions(safeProfile.role_id)
          : [];

        console.log('[ProfileFetch][DEBUG] Profile and permissions fetched:', { 
          profileId: safeProfile.id, 
          role: safeProfile.role,
          permissionsCount: permissions.length
        });

        return { profile: safeProfile, permissions };
      } catch (profileFetchError) {
        console.error('[ProfileFetch][DEBUG] Exception during profile fetch:', profileFetchError);
        return { profile: null, permissions: [] };
      }
    } catch (error) {
      console.error('[ProfileFetch][DEBUG] Error in fetchAndSetProfile:', error);
      return { profile: null, permissions: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchAndSetProfile,
    isLoading
  };
};

export default useProfileFetch;
