
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile, safeQueryResult } from '@/types/user';
import { fetchUserPermissions } from '@/lib/auth/sessionUtils';

interface AuthUserInfo {
  id: string;
  role?: string;
  email?: string;
}

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
      
      // Set a global timeout for the entire fetch operation
      const timeoutPromise = new Promise<{ profile: UserProfile | null; permissions: string[] }>(resolve => {
        setTimeout(() => {
          console.log('Profile fetch operation timed out after 8 seconds, returning minimal profile');
          
          // Create a minimal emergency profile when timing out
          const minimalProfile: UserProfile = {
            id: userId,
            role: 'patient', // Default fallback role
            role_id: null,
            full_name: 'User',
            email: null,
            avatar_url: null,
            date_of_birth: null,
            city: null,
            auth_method: 'password',
            is_blocked: false,
            doctor_stamp_url: null,
            doctor_signature_url: null,
            pharmacist_stamp_url: null,
            pharmacist_signature_url: null,
            cns_card_front: null,
            cns_card_back: null,
            cns_number: null,
            deleted_at: null,
            created_at: null,
            updated_at: null,
            license_number: null,
            phone_number: null,
            address: null,
            pharmacy_id: null,
            pharmacy_name: null,
            pharmacy_logo_url: null
          };
          
          resolve({ profile: minimalProfile, permissions: [] });
        }, 8000);
      });

      // First, check if the user exists in auth users with a shorter timeout
      const authUserPromise = new Promise<AuthUserInfo>(async (resolve) => {
        try {
          const { data: authUser, error: authError } = await supabase.auth.getUser();

          if (!authError && authUser?.user) {
            resolve({
              id: authUser.user.id,
              role: authUser.user.user_metadata?.role,
              email: authUser.user.email
            });
          } else {
            resolve({ id: userId });
          }
        } catch (err) {
          console.error('Error fetching auth user:', err);
          resolve({ id: userId });
        }
      });
      
      // Enforce a timeout on the auth user check
      const authUserWithTimeout = Promise.race([
        authUserPromise,
        new Promise<AuthUserInfo>(resolve => 
          setTimeout(() => resolve({ id: userId }), 3000)
        )
      ]);
      
      // Get auth user info with timeout protection
      const authUserInfo = await authUserWithTimeout;
      const effectiveUserId = authUserInfo.id || userId;
      
      // Use optional chaining to safely access properties that might not exist
      // Default role and email values to use if not provided
      const defaultRole = authUserInfo?.role || 'patient';
      const defaultEmail = authUserInfo?.email || '';
      
      // Main profile fetch operation
      const profileFetchOperation = async () => {
        try {
          // Fetch user profile
          const { data: profile, error } = await supabase
            .from('profiles')
            .select(`
              id, role, role_id, full_name, email, avatar_url, auth_method,
              is_blocked, city, date_of_birth, license_number, cns_card_front,
              cns_card_back, cns_number, doctor_stamp_url, doctor_signature_url,
              pharmacist_stamp_url, pharmacist_signature_url, deleted_at,
              created_at, updated_at, pharmacy_name, pharmacy_logo_url
            `)
            .eq('id', effectiveUserId)
            .maybeSingle();

          if (error) {
            console.error('Profile fetch error:', error);
            return { profile: null, permissions: [] };
          }

          if (!profile) {
            console.log('No profile found for user:', effectiveUserId);
            
            // If there's no profile, create one automatically with a separate timeout
            try {
              console.log('Creating profile for user:', effectiveUserId);
              
              // Create profile with simplified approach
              const createProfilePromise = supabase.rpc('create_profile_secure', {
                user_id: effectiveUserId,
                user_role: defaultRole,
                user_full_name: 'User',
                user_email: defaultEmail,
                user_license_number: null,
              });
              
              // Set timeout for profile creation
              await Promise.race([
                createProfilePromise,
                new Promise(resolve => setTimeout(resolve, 4000))
              ]);
              
              // Try to fetch the newly created profile
              const { data: newProfile, error: newProfileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', effectiveUserId)
                .maybeSingle();
                
              if (newProfileError || !newProfile) {
                console.error('Error fetching newly created profile:', newProfileError);
                
                // Return minimal profile as fallback
                const minimalProfile: UserProfile = {
                  id: effectiveUserId,
                  role: defaultRole,
                  role_id: null,
                  full_name: 'User',
                  email: defaultEmail,
                  avatar_url: null,
                  date_of_birth: null,
                  city: null,
                  auth_method: 'password',
                  is_blocked: false,
                  doctor_stamp_url: null,
                  doctor_signature_url: null,
                  pharmacist_stamp_url: null,
                  pharmacist_signature_url: null,
                  cns_card_front: null,
                  cns_card_back: null,
                  cns_number: null,
                  deleted_at: null,
                  created_at: null,
                  updated_at: null,
                  license_number: null,
                  phone_number: null,
                  address: null,
                  pharmacy_id: null,
                  pharmacy_name: null,
                  pharmacy_logo_url: null
                };
                
                return { profile: minimalProfile, permissions: [] };
              }
              
              console.log('Profile created and fetched successfully');
              
              const completeNewProfile: UserProfile = {
                ...newProfile as any,
                pharmacist_stamp_url: null,
                pharmacist_signature_url: null,
                pharmacy_id: null,
                pharmacy_name: null,
                pharmacy_logo_url: null
              };
              
              return { profile: completeNewProfile, permissions: [] };
            } catch (createProfileError) {
              console.error('Error in profile creation:', createProfileError);
              
              // Return minimal profile as fallback
              const minimalProfile: UserProfile = {
                id: effectiveUserId,
                role: defaultRole,
                role_id: null,
                full_name: 'User',
                email: defaultEmail,
                avatar_url: null,
                date_of_birth: null,
                city: null,
                auth_method: 'password',
                is_blocked: false,
                doctor_stamp_url: null,
                doctor_signature_url: null,
                pharmacist_stamp_url: null,
                pharmacist_signature_url: null,
                cns_card_front: null,
                cns_card_back: null,
                cns_number: null,
                deleted_at: null,
                created_at: null,
                updated_at: null,
                license_number: null,
                phone_number: null,
                address: null,
                pharmacy_id: null,
                pharmacy_name: null,
                pharmacy_logo_url: null
              };
              
              return { profile: minimalProfile, permissions: [] };
            }
          }

          // Get pharmacy_id if available (with timeout protection)
          let pharmacyId = null;
          try {
            const pharmacyPromise = supabase
              .from('user_pharmacies')
              .select('pharmacy_id')
              .eq('user_id', effectiveUserId)
              .maybeSingle();
              
            const { data: pharmacyData } = await Promise.race([
              pharmacyPromise,
              new Promise(resolve => setTimeout(() => resolve({ data: null }), 3000))
            ]) as any;
            
            pharmacyId = pharmacyData?.pharmacy_id || null;
          } catch (pharmacyError) {
            console.error('Error fetching pharmacy_id:', pharmacyError);
          }

          // Ensure the profile object has all required properties
          const completeProfile: UserProfile = {
            ...profile as any,
            pharmacist_stamp_url: profile?.pharmacist_stamp_url || null,
            pharmacist_signature_url: profile?.pharmacist_signature_url || null,
            pharmacy_id: pharmacyId || null,
            pharmacy_name: profile?.pharmacy_name || null,
            pharmacy_logo_url: profile?.pharmacy_logo_url || null
          };

          // Fetch permissions with timeout protection
          let permissions: string[] = [];
          try {
            if (completeProfile.role_id) {
              const permissionsPromise = fetchUserPermissions(completeProfile.role_id);
              permissions = await Promise.race([
                permissionsPromise,
                new Promise<string[]>(resolve => setTimeout(() => resolve([]), 3000))
              ]);
            }
          } catch (permError) {
            console.error('Error fetching permissions:', permError);
          }

          console.log('Profile and permissions fetched successfully:', {
            profileId: completeProfile.id,
            role: completeProfile.role,
            permissionsCount: permissions.length
          });

          return { profile: completeProfile, permissions };
        } catch (profileError) {
          console.error('Exception during profile fetch:', profileError);
          
          // Return minimal profile as fallback
          const minimalProfile: UserProfile = {
            id: effectiveUserId,
            role: defaultRole,
            role_id: null,
            full_name: 'User',
            email: defaultEmail,
            avatar_url: null,
            date_of_birth: null,
            city: null,
            auth_method: 'password',
            is_blocked: false,
            doctor_stamp_url: null,
            doctor_signature_url: null,
            pharmacist_stamp_url: null,
            pharmacist_signature_url: null,
            cns_card_front: null,
            cns_card_back: null,
            cns_number: null,
            deleted_at: null,
            created_at: null,
            updated_at: null,
            license_number: null,
            phone_number: null,
            address: null,
            pharmacy_id: null,
            pharmacy_name: null,
            pharmacy_logo_url: null
          };
          
          return { profile: minimalProfile, permissions: [] };
        }
      };

      // Race the main operation against the timeout
      const result = await Promise.race([profileFetchOperation(), timeoutPromise]);
      return result;
    } catch (error) {
      console.error('Fatal error in fetchAndSetProfile:', error);
      
      // Return minimal profile as fallback
      const minimalProfile: UserProfile = {
        id: userId,
        role: 'patient',
        role_id: null,
        full_name: 'User',
        email: null,
        avatar_url: null,
        date_of_birth: null,
        city: null,
        auth_method: 'password',
        is_blocked: false,
        doctor_stamp_url: null,
        doctor_signature_url: null,
        pharmacist_stamp_url: null,
        pharmacist_signature_url: null,
        cns_card_front: null,
        cns_card_back: null,
        cns_number: null,
        deleted_at: null,
        created_at: null,
        updated_at: null,
        license_number: null,
        phone_number: null,
        address: null,
        pharmacy_id: null,
        pharmacy_name: null,
        pharmacy_logo_url: null
      };
      
      return { profile: minimalProfile, permissions: [] };
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
