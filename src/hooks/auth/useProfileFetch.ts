
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
        // First check what columns exist in the profiles table
        const { data: columnInfo, error: columnError } = await supabase
          .rpc('get_profile_columns');
          
        if (columnError) {
          console.error('Error checking profile columns:', columnError);
        }
        
        // Create a dynamic select string based on known columns
        // Always include these essential columns
        let selectColumns = `
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
          deleted_at,
          created_at,
          updated_at
        `;
        
        // Optional columns - only include if they exist
        if (columnInfo?.includes('cns_card_front')) selectColumns += ', cns_card_front';
        if (columnInfo?.includes('cns_card_back')) selectColumns += ', cns_card_back';
        if (columnInfo?.includes('cns_number')) selectColumns += ', cns_number';
        if (columnInfo?.includes('doctor_stamp_url')) selectColumns += ', doctor_stamp_url';
        if (columnInfo?.includes('doctor_signature_url')) selectColumns += ', doctor_signature_url';
        if (columnInfo?.includes('pharmacist_stamp_url')) selectColumns += ', pharmacist_stamp_url';
        if (columnInfo?.includes('pharmacist_signature_url')) selectColumns += ', pharmacist_signature_url';
        if (columnInfo?.includes('pharmacy_id')) selectColumns += ', pharmacy_id';
        if (columnInfo?.includes('pharmacy_name')) selectColumns += ', pharmacy_name';
        if (columnInfo?.includes('pharmacy_logo_url')) selectColumns += ', pharmacy_logo_url';
        
        // Simplified query using only columns that exist
        const { data: profile, error } = await supabase
          .from('profiles')
          .select(selectColumns)
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
            
            // Create a simplified profile with just the required fields
            await supabase.from('profiles').insert({
              id: userId,
              role: role,
              full_name: fullName,
              email: userData.user.email || ''
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
              id: newProfile.id,
              role: newProfile.role,
              role_id: newProfile.role_id || null,
              full_name: newProfile.full_name || null,
              email: newProfile.email || null,
              avatar_url: newProfile.avatar_url || null,
              auth_method: newProfile.auth_method || null,
              is_blocked: newProfile.is_blocked || false,
              date_of_birth: newProfile.date_of_birth || null,
              city: newProfile.city || null,
              license_number: newProfile.license_number || null,
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
              deleted_at: null,
              created_at: newProfile.created_at || new Date().toISOString(),
              updated_at: newProfile.updated_at || new Date().toISOString()
            };
            
            const safeNewProfile = safeQueryResult<UserProfile>(completeNewProfile);
            return { profile: safeNewProfile, permissions: [] };
          } catch (createError) {
            console.error('Error creating profile:', createError);
            return { profile: null, permissions: [] };
          }
        }

        // Create a complete profile object with default values for any missing fields
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
          cns_card_front: (profile as any).cns_card_front || null,
          cns_card_back: (profile as any).cns_card_back || null,
          cns_number: (profile as any).cns_number || null,
          doctor_stamp_url: (profile as any).doctor_stamp_url || null,
          doctor_signature_url: (profile as any).doctor_signature_url || null,
          pharmacist_stamp_url: (profile as any).pharmacist_stamp_url || null,
          pharmacist_signature_url: (profile as any).pharmacist_signature_url || null,
          pharmacy_id: (profile as any).pharmacy_id || null,
          pharmacy_name: (profile as any).pharmacy_name || null,
          pharmacy_logo_url: (profile as any).pharmacy_logo_url || null,
          deleted_at: profile.deleted_at || null,
          created_at: profile.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString()
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
