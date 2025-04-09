
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile, safeQueryResult } from '@/types/user';
import { fetchUserPermissions } from '@/lib/auth/sessionUtils';

export const useProfileFetch = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAndSetProfile = useCallback(async (userId: string): Promise<{ profile: UserProfile | null; permissions: string[] }> => {
    console.log('Starting profile fetch for user:', userId);
    try {
      setIsLoading(true);

      // Directly fetch profile with minimal validation to avoid unnecessary calls
      try {
        // Simplify the query to avoid errors with non-existent columns
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
            updated_at
          `)
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Profile fetch error:', error);
          return { profile: null, permissions: [] };
        }

        if (!profile) {
          console.log('No profile found for user:', userId);
          
          // Attempt to create a basic profile if none exists
          try {
            const { data: userData } = await supabase.auth.getUser();
            
            if (!userData?.user) {
              console.error('No user data available for profile creation');
              return { profile: null, permissions: [] };
            }
            
            const role = userData.user.user_metadata?.role || 'patient';
            const fullName = userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || 'User';
            
            // Use the secure function to create profile
            await supabase.rpc('create_profile_secure', {
              user_id: userId,
              user_role: role,
              user_full_name: fullName,
              user_email: userData.user.email || '',
              user_license_number: userData.user.user_metadata?.license_number || null,
            });
            
            // Try to fetch the newly created profile
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
              
            if (!newProfile) {
              console.error('Failed to create profile');
              return { profile: null, permissions: [] };
            }
            
            // Create a complete profile with default values for missing fields
            const completeNewProfile: UserProfile = {
              ...(newProfile as any),
              pharmacist_stamp_url: null,
              pharmacist_signature_url: null,
              pharmacy_id: null,
              pharmacy_name: null,
              pharmacy_logo_url: null
            };
            
            const safeNewProfile = safeQueryResult<UserProfile>(completeNewProfile);
            return { profile: safeNewProfile, permissions: [] };
          } catch (createError) {
            console.error('Error creating profile:', createError);
            return { profile: null, permissions: [] };
          }
        }

        // Ensure the profile object has all required properties
        // Add missing pharmacy-related fields that might not exist in the database yet
        const completeProfile: UserProfile = {
          ...(profile as any),
          pharmacist_stamp_url: profile?.pharmacist_stamp_url || null,
          pharmacist_signature_url: profile?.pharmacist_signature_url || null,
          pharmacy_name: profile?.pharmacy_name || null,
          pharmacy_logo_url: profile?.pharmacy_logo_url || null,
          pharmacy_id: profile?.pharmacy_id || null
        };

        const safeProfile = safeQueryResult<UserProfile>(completeProfile);
        if (!safeProfile) {
          console.error('Failed to process profile data');
          return { profile: null, permissions: [] };
        }

        // Get permissions if we have a role_id
        const permissions = safeProfile.role_id 
          ? await fetchUserPermissions(safeProfile.role_id)
          : [];

        console.log('Profile and permissions fetched successfully:', { 
          role: safeProfile.role,
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
