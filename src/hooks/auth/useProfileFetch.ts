
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user';
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
      // Define createBasicProfile within fetchProfile scope
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

        // First try: Get all fields with *
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (!error) {
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
                pharmacy_id: data.pharmacy_id || null,
                pharmacy_name: data.pharmacy_name || null,
                pharmacy_logo_url: data.pharmacy_logo_url || null,
                phone_number: data.phone_number || null,
                deleted_at: data.deleted_at || null,
                created_at: data.created_at || new Date().toISOString(),
                updated_at: data.updated_at || new Date().toISOString(),
              };
              
              setProfile(fetchedProfile);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.log('Error with first profile fetch attempt:', err);
          // Continue to the fallback approach
        }
        
        // Second try: Explicitly specify columns to avoid missing column errors
        const { data: limitedProfile, error: limitedError } = await supabase
          .from('profiles')
          .select(`
            id, role, role_id, full_name, email, 
            avatar_url, auth_method, is_blocked, 
            city, date_of_birth, license_number,
            deleted_at, created_at, updated_at,
            pharmacist_stamp_url, pharmacist_signature_url,
            doctor_stamp_url, doctor_signature_url,
            cns_card_front, cns_card_back, cns_number
          `)
          .eq('id', userId)
          .maybeSingle();
          
        if (limitedError) {
          console.error('Error fetching profile with limited fields:', limitedError);
          setError(limitedError);
          
          // Create a basic profile even on error
          const basicProfile = createBasicProfile(userId);
          setProfile(basicProfile);
        } else if (limitedProfile) {
          // Create a complete profile with default values for missing fields
          const fetchedProfile: UserProfile = {
            id: limitedProfile.id || userId,
            role: limitedProfile.role || 'patient',
            role_id: limitedProfile.role_id || null,
            full_name: limitedProfile.full_name || null,
            email: limitedProfile.email || null,
            avatar_url: limitedProfile.avatar_url || null,
            auth_method: limitedProfile.auth_method || null,
            is_blocked: limitedProfile.is_blocked || false,
            date_of_birth: limitedProfile.date_of_birth || null,
            city: limitedProfile.city || null,
            license_number: limitedProfile.license_number || null,
            cns_card_front: limitedProfile.cns_card_front || null,
            cns_card_back: limitedProfile.cns_card_back || null,
            cns_number: limitedProfile.cns_number || null,
            doctor_stamp_url: limitedProfile.doctor_stamp_url || null,
            doctor_signature_url: limitedProfile.doctor_signature_url || null,
            pharmacist_stamp_url: limitedProfile.pharmacist_stamp_url || null,
            pharmacist_signature_url: limitedProfile.pharmacist_signature_url || null,
            // Set pharmacy fields to null as they might not exist in the database yet
            pharmacy_id: null,
            pharmacy_name: null,
            pharmacy_logo_url: null,
            phone_number: null,
            deleted_at: limitedProfile.deleted_at || null,
            created_at: limitedProfile.created_at || new Date().toISOString(),
            updated_at: limitedProfile.updated_at || new Date().toISOString(),
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
