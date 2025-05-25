
import { useState, useCallback, useRef } from 'react';
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
  const fetchInProgress = useRef<Map<string, Promise<{ profile: UserProfile | null; permissions: string[] }>>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const fetchAndSetProfile = useCallback(async (userId: string): Promise<{ profile: UserProfile | null; permissions: string[] }> => {
    if (!userId) {
      console.error('No user ID provided to fetchAndSetProfile');
      return { profile: null, permissions: [] };
    }
    
    // Check if we already have a fetch in progress for this user
    const existingFetch = fetchInProgress.current.get(userId);
    if (existingFetch) {
      console.log('Profile fetch already in progress for user:', userId);
      return existingFetch;
    }
    
    // Cancel any existing fetch for this user
    const existingController = abortControllers.current.get(userId);
    if (existingController) {
      existingController.abort();
      abortControllers.current.delete(userId);
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    abortControllers.current.set(userId, abortController);
    
    console.log('Starting profile fetch for user:', userId);
    
    const fetchPromise = (async () => {
      try {
        setIsLoading(true);
        
        // Set a global timeout for the entire fetch operation
        const timeoutPromise = new Promise<{ profile: UserProfile | null; permissions: string[] }>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Profile fetch timeout'));
          }, 3000); // Reduced timeout to 3 seconds
        });

        // First, check if the user exists in auth users with a shorter timeout
        const authUserPromise = new Promise<AuthUserInfo>(async (resolve) => {
          try {
            if (abortController.signal.aborted) {
              throw new Error('Aborted');
            }

            const { data: authUser, error: authError } = await supabase.auth.getUser();

            if (!authError && authUser?.user && authUser.user.id === userId) {
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
            setTimeout(() => resolve({ id: userId }), 1500)
          )
        ]);
        
        // Get auth user info with timeout protection
        const authUserInfo = await authUserWithTimeout;
        
        if (abortController.signal.aborted) {
          throw new Error('Fetch aborted');
        }
        
        const effectiveUserId = authUserInfo.id || userId;
        
        // Use optional chaining to safely access properties that might not exist
        const defaultRole = authUserInfo?.role || 'patient';
        const defaultEmail = authUserInfo?.email || '';
        
        // Main profile fetch operation with single request
        const profileFetchOperation = async () => {
          try {
            if (abortController.signal.aborted) {
              throw new Error('Fetch aborted');
            }

            // Single profile fetch request with abort signal
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
              .abortSignal(abortController.signal)
              .maybeSingle();

            if (abortController.signal.aborted) {
              throw new Error('Fetch aborted');
            }

            if (error) {
              console.error('Profile fetch error:', error);
              throw error;
            }

            if (!profile) {
              console.log('No profile found for user:', effectiveUserId);
              
              // Return minimal profile as fallback instead of creating new one
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

            // Get pharmacy_id if available (with timeout protection)
            let pharmacyId = null;
            try {
              if (!abortController.signal.aborted) {
                const pharmacyPromise = supabase
                  .from('user_pharmacies')
                  .select('pharmacy_id')
                  .eq('user_id', effectiveUserId)
                  .abortSignal(abortController.signal)
                  .maybeSingle();
                  
                const { data: pharmacyData } = await Promise.race([
                  pharmacyPromise,
                  new Promise(resolve => setTimeout(() => resolve({ data: null }), 1500))
                ]) as any;
                
                pharmacyId = pharmacyData?.pharmacy_id || null;
              }
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
            let userPermissions: string[] = [];
            try {
              if (completeProfile.role_id && !abortController.signal.aborted) {
                const permissionsPromise = fetchUserPermissions(completeProfile.role_id);
                userPermissions = await Promise.race([
                  permissionsPromise,
                  new Promise<string[]>(resolve => setTimeout(() => resolve([]), 1500))
                ]);
              }
            } catch (permError) {
              console.error('Error fetching permissions:', permError);
            }

            console.log('Profile and permissions fetched successfully:', {
              profileId: completeProfile.id,
              role: completeProfile.role,
              permissionsCount: userPermissions.length
            });

            return { profile: completeProfile, permissions: userPermissions };
          } catch (profileError) {
            if (abortController.signal.aborted) {
              throw new Error('Fetch aborted');
            }
            
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
        if (abortController.signal.aborted) {
          console.log('Profile fetch was aborted for user:', userId);
          throw new Error('Fetch aborted');
        }
        
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
        fetchInProgress.current.delete(userId);
        abortControllers.current.delete(userId);
      }
    })();
    
    // Store the promise to prevent duplicate requests
    fetchInProgress.current.set(userId, fetchPromise);
    
    return fetchPromise;
  }, []);

  // Cleanup function to abort pending requests
  const cleanup = useCallback(() => {
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
    fetchInProgress.current.clear();
  }, []);

  return {
    fetchAndSetProfile,
    isLoading,
    cleanup
  };
};

export default useProfileFetch;
