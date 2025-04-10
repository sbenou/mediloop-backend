
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
          // Create a complete profile with default values for missing fields
          const fetchedProfile: UserProfile = {
            id: data.id || userId,
            role: data.role || 'patient',
            role_id: data.role_id || null,
            full_name: data.full_name || null,
            email: data.email || null,
            avatar_url: data.avatar_url || null,
            auth_method: data.auth_method || null,
            is_blocked: data.is_blocked || false,
            date_of_birth: data.date_of_birth || null,
            city: data.city || null,
            license_number: data.license_number || null,
            cns_card_front: data.cns_card_front || null,
            cns_card_back: data.cns_card_back || null,
            cns_number: data.cns_number || null,
            doctor_stamp_url: data.doctor_stamp_url || null,
            doctor_signature_url: data.doctor_signature_url || null,
            pharmacist_stamp_url: data.pharmacist_stamp_url || null,
            pharmacist_signature_url: data.pharmacist_signature_url || null,
            pharmacy_id: (data as any).pharmacy_id || null,
            pharmacy_name: (data as any).pharmacy_name || null,
            pharmacy_logo_url: (data as any).pharmacy_logo_url || null,
            phone_number: data.phone_number || null,
            deleted_at: data.deleted_at || null,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
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
