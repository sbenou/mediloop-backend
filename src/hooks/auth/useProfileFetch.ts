
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user';
import { fetchUserPermissions } from '@/lib/auth/sessionUtils';

export const useProfileFetch = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAndSetProfile = useCallback(async (userId: string): Promise<{ profile: UserProfile | null; permissions: string[] }> => {
    console.log('[ProfileFetch][DEBUG] Starting profile fetch for user:', userId);
    try {
      setIsLoading(true);

      // First, check if the user exists in auth users
      try {
        // Directly use getUser without passing userId - it will use the current session
        const { data: authUser, error: authError } = await supabase.auth.getUser();

        if (authError) {
          console.error('[ProfileFetch][DEBUG] Error fetching auth user:', authError);
          return { profile: null, permissions: [] };
        }

        if (!authUser?.user) {
          console.error('[ProfileFetch][DEBUG] No auth user found in current session');
          return { profile: null, permissions: [] };
        }

        if (authUser.user.id !== userId) {
          console.warn('[ProfileFetch][DEBUG] Session user ID does not match requested user ID', { 
            sessionUserId: authUser.user.id, 
            requestedUserId: userId 
          });
        }

        console.log('[ProfileFetch][DEBUG] Auth user found, fetching profile:', authUser.user.id);
      } catch (userFetchError) {
        console.error('[ProfileFetch][DEBUG] Exception during auth user fetch:', userFetchError);
        // Continue anyway to check if we have a profile
      }

      // Fetch user profile
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')  // Select all fields to ensure we get complete profile
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('[ProfileFetch][DEBUG] Profile fetch error:', error);
          return { profile: null, permissions: [] };
        }

        if (!profile) {
          console.log('[ProfileFetch][DEBUG] No profile found for user:', userId);
          // If there's no profile, create one automatically
          try {
            console.log('[ProfileFetch][DEBUG] Creating profile for user:', userId);
            
            // Get user data directly to ensure we have the latest
            const { data: userData, error: userDataError } = await supabase.auth.getUser();
            
            if (userDataError || !userData.user) {
              console.error('[ProfileFetch][DEBUG] Error getting user data for profile creation:', userDataError);
              return { profile: null, permissions: [] };
            }
            
            // Extract role from user metadata if available
            const role = userData.user.user_metadata?.role || 'patient';
            const fullName = userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || 'User';
            
            const { error: createError } = await supabase.rpc('create_profile_secure', {
              user_id: userId,
              user_role: role,
              user_full_name: fullName,
              user_email: userData.user.email || '',
              user_license_number: userData.user.user_metadata?.license_number || null,
            });
            
            if (createError) {
              console.error('[ProfileFetch][DEBUG] Error creating profile:', createError);
              return { profile: null, permissions: [] };
            }
            
            // Try to fetch the newly created profile
            const { data: newProfile, error: newProfileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle();
              
            if (newProfileError || !newProfile) {
              console.error('[ProfileFetch][DEBUG] Error fetching newly created profile:', newProfileError);
              return { profile: null, permissions: [] };
            }
            
            console.log('[ProfileFetch][DEBUG] Profile created and fetched successfully');
            
            // Get permissions for the user if they have a role_id
            const permissions = newProfile.role_id 
              ? await fetchUserPermissions(newProfile.role_id)
              : [];
              
            return { 
              profile: newProfile as UserProfile, 
              permissions 
            };
          } catch (createProfileError) {
            console.error('[ProfileFetch][DEBUG] Error in profile creation:', createProfileError);
            return { profile: null, permissions: [] };
          }
        }

        // Get the pharmacy_id separately if needed
        let pharmacyId = profile.pharmacy_id || null;
        if (!pharmacyId) {
          try {
            const { data: pharmacyData } = await supabase
              .from('user_pharmacies')
              .select('pharmacy_id')
              .eq('user_id', userId)
              .maybeSingle();
            
            pharmacyId = pharmacyData?.pharmacy_id || null;
            console.log('[ProfileFetch][DEBUG] Fetched pharmacy_id from user_pharmacies:', pharmacyId);
          } catch (pharmacyError) {
            console.error('[ProfileFetch][DEBUG] Error fetching pharmacy_id:', pharmacyError);
          }
        }

        // Add pharmacy_id to the profile if it exists
        if (pharmacyId && !profile.pharmacy_id) {
          profile.pharmacy_id = pharmacyId;
        }

        // Get permissions for the user if they have a role_id
        const permissions = profile.role_id 
          ? await fetchUserPermissions(profile.role_id)
          : [];

        console.log('[ProfileFetch][DEBUG] Profile and permissions fetched:', { 
          profileId: profile.id, 
          role: profile.role,
          pharmacyId: profile.pharmacy_id,
          permissionsCount: permissions.length 
        });

        return { profile: profile as UserProfile, permissions };
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
