
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

      // First, check if the user exists in auth users
      const { data: authUser, error: authError } = await supabase.auth.getUser(userId);

      if (authError) {
        console.error('Error fetching auth user:', authError);
        return { profile: null, permissions: [] };
      }

      if (!authUser?.user) {
        console.error('No auth user found with ID:', userId);
        return { profile: null, permissions: [] };
      }

      console.log('Auth user found, fetching profile:', authUser.user.id);

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
        console.error('No profile found for user:', userId);
        // If there's no profile, create one automatically
        try {
          console.log('Creating profile for user:', userId);
          const userData = authUser.user;
          
          // Extract role from user metadata if available
          const role = userData.user_metadata?.role || 'patient';
          const fullName = userData.user_metadata?.full_name || userData.user_metadata?.name || 'User';
          
          const { error: createError } = await supabase.rpc('create_profile_secure', {
            user_id: userId,
            user_role: role,
            user_full_name: fullName,
            user_email: userData.email || '',
            user_license_number: userData.user_metadata?.license_number || null,
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
          const safeNewProfile = safeQueryResult<UserProfile>(newProfile);
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
      try {
        const { data: pharmacyData } = await supabase
          .from('user_pharmacies')
          .select('pharmacy_id')
          .eq('user_id', userId)
          .maybeSingle();
        
        pharmacyId = pharmacyData?.pharmacy_id || null;
        console.log('Fetched pharmacy_id from user_pharmacies:', pharmacyId);
      } catch (pharmacyError) {
        console.error('Error fetching pharmacy_id:', pharmacyError);
      }

      const safeProfile = safeQueryResult<UserProfile>(profile);
      if (!safeProfile) {
        console.error('Failed to process profile data for user:', userId);
        return { profile: null, permissions: [] };
      }

      // Manually add the pharmacy_id to the profile
      if (pharmacyId) {
        safeProfile.pharmacy_id = pharmacyId;
      }

      const permissions = safeProfile.role_id 
        ? await fetchUserPermissions(safeProfile.role_id)
        : [];

      console.log('Profile and permissions fetched:', { 
        profileId: safeProfile.id, 
        role: safeProfile.role,
        pharmacyId: safeProfile.pharmacy_id,
        permissionsCount: permissions.length 
      });

      return { profile: safeProfile, permissions };
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
