
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile, safeQueryResult } from '@/types/user';
import { fetchUserPermissions } from '@/lib/auth/sessionUtils';

export const useProfileFetch = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAndSetProfile = useCallback(async (userId: string): Promise<{ profile: UserProfile | null; permissions: string[] }> => {
    if (!userId) {
      console.error('No user ID provided to fetchAndSetProfile');
      return { profile: null, permissions: [] };
    }
    
    console.log('Starting profile fetch for user:', userId);
    try {
      setIsLoading(true);

      // First, check if the user exists in auth users
      try {
        // Directly use getUser without passing userId - it will use the current session
        const { data: authUser, error: authError } = await supabase.auth.getUser();

        if (authError) {
          console.error('Error fetching auth user:', authError);
          return { profile: null, permissions: [] };
        }

        if (!authUser?.user) {
          console.error('No auth user found in current session');
          return { profile: null, permissions: [] };
        }

        if (authUser.user.id !== userId) {
          console.warn('Session user ID does not match requested user ID', { 
            sessionUserId: authUser.user.id, 
            requestedUserId: userId 
          });
          
          // If IDs don't match, use the session user ID instead as it's more reliable
          userId = authUser.user.id;
          console.log('Switching to session user ID for profile fetch:', userId);
        }

        console.log('Auth user found, fetching profile:', authUser.user.id);
      } catch (userFetchError) {
        console.error('Exception during auth user fetch:', userFetchError);
        // Continue anyway to check if we have a profile
      }

      // Fetch user profile
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select(`
            id,
            role,
            role_id,
            full_name,
            email,
            avatar_url,
            auth_method,
            is_blocked,
            city,
            date_of_birth,
            license_number,
            cns_card_front,
            cns_card_back,
            cns_number,
            doctor_stamp_url,
            doctor_signature_url,
            pharmacist_stamp_url,
            pharmacist_signature_url,
            deleted_at,
            created_at,
            updated_at,
            pharmacy_name,
            pharmacy_logo_url
          `)
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Profile fetch error:', error);
          return { profile: null, permissions: [] };
        }

        if (!profile) {
          console.log('No profile found for user:', userId);
          // If there's no profile, create one automatically
          try {
            console.log('Creating profile for user:', userId);
            
            // Get user data directly to ensure we have the latest
            const { data: userData, error: userDataError } = await supabase.auth.getUser();
            
            if (userDataError || !userData.user) {
              console.error('Error getting user data for profile creation:', userDataError);
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
              console.error('Error creating profile:', createError);
              return { profile: null, permissions: [] };
            }
            
            // Try to fetch the newly created profile
            const { data: newProfile, error: newProfileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle();
              
            if (newProfileError || !newProfile) {
              console.error('Error fetching newly created profile:', newProfileError);
              return { profile: null, permissions: [] };
            }
            
            console.log('Profile created and fetched successfully');
            
            // Create a complete profile object with default values for all fields
            const completeNewProfile: UserProfile = {
              ...newProfile as any,
              pharmacist_stamp_url: null,
              pharmacist_signature_url: null,
              pharmacy_id: null,
              pharmacy_name: null,
              pharmacy_logo_url: null
            };
            
            const safeNewProfile = safeQueryResult<UserProfile>(completeNewProfile);
            
            // Ensure all expected fields are present even if the database doesn't have them
            if (safeNewProfile && !safeNewProfile.role) {
              safeNewProfile.role = role;
            }
            
            return { 
              profile: safeNewProfile, 
              permissions: [] 
            };
          } catch (createProfileError) {
            console.error('Error in profile creation:', createProfileError);
            return { profile: null, permissions: [] };
          }
        }

        // Get the pharmacy_id separately to handle the case where the column might not exist yet
        let pharmacyId = null;
        let pharmacyName = null;
        try {
          console.log('Attempting to fetch pharmacy data for user:', userId);
          // Add a timeout to prevent hanging operations
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Pharmacy fetch timeout')), 5000);
          });
          
          const fetchPromise = supabase
            .from('user_pharmacies')
            .select('pharmacy_id')
            .eq('user_id', userId)
            .maybeSingle();
            
          // Use Promise.race to implement a timeout
          const { data: pharmacyData, error: pharmacyError } = await Promise.race([
            fetchPromise,
            timeoutPromise
          ]) as any;
          
          if (pharmacyError) {
            console.error('Error fetching pharmacy_id:', pharmacyError);
          } else if (pharmacyData?.pharmacy_id) {
            pharmacyId = pharmacyData.pharmacy_id;
            console.log('Fetched pharmacy_id from user_pharmacies:', pharmacyId);
            
            // Also fetch pharmacy name
            try {
              const { data: pharmacy, error: pharmacyNameError } = await supabase
                .from('pharmacies')
                .select('name')
                .eq('id', pharmacyId)
                .single();
                
              if (!pharmacyNameError && pharmacy) {
                pharmacyName = pharmacy.name;
                console.log('Fetched pharmacy name:', pharmacyName);
                
                // Update the profile with pharmacy name if it's not already set
                if (profile.role === 'pharmacist' && (!profile.pharmacy_name || profile.pharmacy_name !== pharmacyName)) {
                  await supabase
                    .from('profiles')
                    .update({ pharmacy_name: pharmacyName })
                    .eq('id', userId);
                }
              }
            } catch (nameError) {
              console.error('Error fetching pharmacy name:', nameError);
            }
          }
        } catch (pharmacyError) {
          console.error('Error or timeout fetching pharmacy_id:', pharmacyError);
          // Continue without pharmacy data - don't let this block the auth process
        }

        // Ensure the profile object has all required properties
        const completeProfile: UserProfile = {
          ...profile as any,
          // Make sure all fields are set, even if they're not in the database
          pharmacist_stamp_url: profile?.pharmacist_stamp_url || null,
          pharmacist_signature_url: profile?.pharmacist_signature_url || null,
          pharmacy_id: pharmacyId || null,
          pharmacy_name: profile?.pharmacy_name || pharmacyName || null,
          pharmacy_logo_url: profile?.pharmacy_logo_url || null
        };

        const safeProfile = safeQueryResult<UserProfile>(completeProfile);
        if (!safeProfile) {
          console.error('Failed to process profile data for user:', userId);
          return { profile: null, permissions: [] };
        }

        // Add a timeout for permissions fetch to prevent hanging
        let permissions: string[] = [];
        try {
          if (safeProfile.role_id) {
            const permissionsPromise = fetchUserPermissions(safeProfile.role_id);
            const timeoutPromise = new Promise<string[]>((_, reject) => {
              setTimeout(() => {
                console.log('Permissions fetch timeout, continuing without permissions');
                return [];
              }, 3000);
            });
            
            permissions = await Promise.race([permissionsPromise, timeoutPromise]);
          }
        } catch (permError) {
          console.error('Error fetching permissions:', permError);
          // Continue without permissions
        }

        console.log('Profile and permissions fetched:', { 
          profileId: safeProfile.id, 
          role: safeProfile.role,
          pharmacyId: safeProfile.pharmacy_id,
          pharmacyName: safeProfile.pharmacy_name,
          permissionsCount: permissions.length 
        });

        return { profile: safeProfile, permissions };
      } catch (profileFetchError) {
        console.error('Exception during profile fetch:', profileFetchError);
        return { profile: null, permissions: [] };
      }
    } catch (error) {
      console.error('Error in fetchAndSetProfile:', error);
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
