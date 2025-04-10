
import { useState, useEffect } from 'react';
import { supabase, checkColumnExists } from '@/lib/supabase';
import { UserProfile } from '@/types/user';
import { toast } from '@/components/ui/use-toast';
import { PostgrestError } from '@supabase/supabase-js';

type GenericStringError = {
  message: string;
};

export const useProfileFetch = (userId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<Error | GenericStringError | PostgrestError | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      // Define createBasicProfile within fetchProfile scope so it's available throughout the function
      const createBasicProfile = (id: string): UserProfile => ({
        id,
        role: 'patient', // Default role
        role_id: null,
        full_name: null,
        email: null,
        avatar_url: null,
        auth_method: null,
        is_blocked: false,
        date_of_birth: null,
        city: null,
        license_number: null,
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
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      try {
        setLoading(true);
        setError(null);

        // Check if specific pharmacist fields exist in the profiles table
        const hasPhamacyId = await checkColumnExists('profiles', 'pharmacy_id');
        const hasPhamacyName = await checkColumnExists('profiles', 'pharmacy_name');
        const hasPhamacyLogoUrl = await checkColumnExists('profiles', 'pharmacy_logo_url');
        
        // Build the base query string
        let queryString = `
          id, role, role_id, full_name, email, 
          avatar_url, auth_method, is_blocked, 
          city, date_of_birth, license_number,
          cns_card_front, cns_card_back, cns_number,
          doctor_stamp_url, doctor_signature_url,
          pharmacist_stamp_url, pharmacist_signature_url,
          phone_number,
          deleted_at, created_at, updated_at
        `;
          
        // Add conditional columns to selection string
        if (hasPhamacyId) queryString += ', pharmacy_id';
        if (hasPhamacyName) queryString += ', pharmacy_name';
        if (hasPhamacyLogoUrl) queryString += ', pharmacy_logo_url';
        
        // Perform the query
        const { data, error } = await supabase
          .from('profiles')
          .select(queryString)
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          setError(error);
          
          // Create a basic profile even on error
          const basicProfile = createBasicProfile(userId);
          setProfile(basicProfile);
          return;
        }

        if (data) {
          // Make sure data is treated as a profile object, not an error
          const profileData = data as any;
          
          // Create a complete profile with default values for missing fields
          const fetchedProfile: UserProfile = {
            id: profileData.id || userId,
            role: profileData.role || 'patient',
            role_id: profileData.role_id || null,
            full_name: profileData.full_name || null,
            email: profileData.email || null,
            avatar_url: profileData.avatar_url || null,
            auth_method: profileData.auth_method || null,
            is_blocked: profileData.is_blocked || false,
            date_of_birth: profileData.date_of_birth || null,
            city: profileData.city || null,
            license_number: profileData.license_number || null,
            cns_card_front: profileData.cns_card_front || null,
            cns_card_back: profileData.cns_card_back || null,
            cns_number: profileData.cns_number || null,
            doctor_stamp_url: profileData.doctor_stamp_url || null,
            doctor_signature_url: profileData.doctor_signature_url || null,
            pharmacist_stamp_url: profileData.pharmacist_stamp_url || null,
            pharmacist_signature_url: profileData.pharmacist_signature_url || null,
            pharmacy_id: profileData.pharmacy_id || null,
            pharmacy_name: profileData.pharmacy_name || null,
            pharmacy_logo_url: profileData.pharmacy_logo_url || null,
            phone_number: profileData.phone_number || null,
            deleted_at: profileData.deleted_at || null,
            created_at: profileData.created_at || new Date().toISOString(),
            updated_at: profileData.updated_at || new Date().toISOString(),
          };
          
          setProfile(fetchedProfile);
        } else {
          // No profile found, create a basic one
          console.log('No profile found for user:', userId);
          const basicProfile = createBasicProfile(userId);
          setProfile(basicProfile);
        }
      } catch (catchError) {
        console.error('Error in useProfileFetch:', catchError);
        const errorObj = catchError instanceof Error ? catchError : new Error(String(catchError));
        setError(errorObj);
        
        // Always create a basic profile in catch block too
        if (userId) {
          const basicProfile = createBasicProfile(userId);
          setProfile(basicProfile);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading, error };
};

export default useProfileFetch;
