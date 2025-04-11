
import { useCallback } from 'react';
import { supabase, getSessionFromStorage, clearAllAuthStorage } from '@/lib/supabase';
import { useProfileFetch } from './useProfileFetch';
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { storeSession } from '@/lib/auth/sessionUtils';
import { toast } from '@/components/ui/use-toast';

export const useSessionManagement = () => {
  const setAuth = useSetRecoilState(authState);
  const { fetchAndSetProfile } = useProfileFetch();
  
  const updateAuthState = useCallback(async (session: any | null) => {
    if (!session?.user) {
      console.log('[SessionManagement][DEBUG] No session or user, clearing auth state');
      setAuth({
        user: null,
        profile: null,
        permissions: [],
        isLoading: false,
      });
      return;
    }

    try {
      // Ensure session is stored for maximum persistence
      storeSession(session);
      
      setAuth(prev => ({
        ...prev,
        user: session.user,
        isLoading: true,
      }));

      // Before trying to fetch the profile, verify that the token is still valid
      try {
        // Perform a lightweight check to verify token validity
        const { data: userData, error: userError } = await supabase.auth.getUser(session.access_token);
        
        if (userError) {
          console.error('[SessionManagement][DEBUG] Token validation error:', userError);
          throw userError;
        }
        
        if (!userData.user || userData.user.id !== session.user.id) {
          console.error('[SessionManagement][DEBUG] User ID mismatch or missing user data');
          throw new Error('User identity validation failed');
        }
        
        console.log('[SessionManagement][DEBUG] Token validation successful for user:', userData.user.id);
      } catch (tokenError) {
        console.error('[SessionManagement][DEBUG] Token validation failed:', tokenError);
        // Clear all auth storage to remove invalid tokens
        clearAllAuthStorage();
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
        
        toast({
          variant: "destructive",
          title: "Session Error",
          description: "Your session appears to be invalid. Please try logging in again.",
        });
        return;
      }

      // Fetch the user profile
      const { profile, permissions } = await fetchAndSetProfile(session.user.id);

      if (!profile) {
        console.log('[SessionManagement][DEBUG] No profile found after fetch, creating one');
        
        // Try to create profile
        try {
          const userData = session.user;
          // Extract role from metadata or default to 'patient'
          const role = userData.user_metadata?.role || 'patient';
          // Extract name from metadata or default to email prefix
          const fullName = userData.user_metadata?.full_name || userData.user_metadata?.name || 
                          userData.email?.split('@')[0] || 'User';
          const email = userData.email || '';
          
          console.log('[SessionManagement][DEBUG] Creating profile with role:', role);
          
          // Create profile using secure RPC function
          const { error: createError } = await supabase.rpc('create_profile_secure', {
            user_id: userData.id,
            user_role: role,
            user_full_name: fullName,
            user_email: email,
            user_license_number: userData.user_metadata?.license_number || null,
          });
          
          if (createError) {
            console.error('[SessionManagement][DEBUG] Error creating profile:', createError);
            
            // Try one more approach with direct insert if RPC fails
            const { error: directInsertError } = await supabase
              .from('profiles')
              .insert({
                id: userData.id,
                role: role,
                full_name: fullName,
                email: email
              });
              
            if (directInsertError) {
              console.error('[SessionManagement][DEBUG] Direct insert also failed:', directInsertError);
              throw directInsertError;
            }
          }
          
          // Try to fetch the newly created profile
          const retryFetch = await fetchAndSetProfile(session.user.id);
          
          if (retryFetch.profile) {
            console.log('[SessionManagement][DEBUG] Successfully created and fetched profile');
            setAuth({
              user: session.user,
              profile: retryFetch.profile,
              permissions: retryFetch.permissions,
              isLoading: false,
            });
            return;
          } else {
            console.error('[SessionManagement][DEBUG] Still no profile after creation attempt');
          }
        } catch (createError) {
          console.error('[SessionManagement][DEBUG] Error creating profile:', createError);
        }
        
        // If we still have the user but no profile, create a minimal profile in state
        // This allows the user to continue using the app even if profile creation failed
        const minimalProfile = {
          id: session.user.id,
          role: 'patient',
          full_name: session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          role_id: null,
          // Add other required fields with null values
          avatar_url: null,
          auth_method: 'password',
          is_blocked: false,
          city: null,
          date_of_birth: null,
          license_number: null,
          doctor_stamp_url: null,
          doctor_signature_url: null,
          pharmacist_stamp_url: null,
          pharmacist_signature_url: null,
          pharmacy_id: null,
          phone_number: null, // Added the missing phone_number property
          cns_card_front: null,
          cns_card_back: null,
          cns_number: null,
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('[SessionManagement][DEBUG] Using minimal profile as fallback');
        
        setAuth({
          user: session.user,
          profile: minimalProfile,
          permissions: [],
          isLoading: false
        });
        
        toast({
          variant: "default", // Changed from "warning" to "default" to match allowed values
          title: "Profile Notice",
          description: "We're using a temporary profile. Some features may be limited.",
          duration: 5000,
        });
        
        return;
      }

      console.log('[SessionManagement][DEBUG] Updating auth state with:', {
        userId: session.user.id,
        role: profile.role,
        permissionsCount: permissions.length
      });

      setAuth({
        user: session.user,
        profile,
        permissions,
        isLoading: false,
      });

    } catch (error) {
      console.error('[SessionManagement][DEBUG] Error in updateAuthState:', error);
      
      // Clear auth storage to prevent reusing bad tokens
      clearAllAuthStorage();
      
      setAuth({
        user: null,
        profile: null,
        permissions: [],
        isLoading: false,
      });
      
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "There was an error loading your profile. Please try logging in again.",
      });
    }
  }, [setAuth, fetchAndSetProfile]);
  
  const refreshSession = useCallback(async () => {
    try {
      console.log('Attempting to refresh session...');
      
      // First try to completely refresh token to get a clean session
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError && refreshData.session) {
          console.log('Session refreshed successfully via API');
          return refreshData.session;
        }
      } catch (refreshErr) {
        console.error('Error during initial refresh attempt:', refreshErr);
      }
      
      // Check in storage if refresh failed
      const storedSession = getSessionFromStorage();
      
      if (!storedSession) {
        // Try to get from Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          return null;
        }
        
        if (!data.session) {
          console.log('No session found, attempting refresh one more time...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            console.warn('Unable to refresh session:', refreshError);
            return null;
          }
          
          console.log('Session refreshed successfully on second attempt');
          return refreshData.session;
        }
        
        return data.session;
      }
      
      // Validate that the stored session is actually usable
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          console.error('Stored session invalid, attempting refresh');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            console.warn('Unable to refresh invalid session:', refreshError);
            // Clear any potentially bad session data
            clearAllAuthStorage();
            return null;
          }
          
          return refreshData.session;
        }
        
        return storedSession;
      } catch (validateErr) {
        console.error('Error validating stored session:', validateErr);
        return null;
      }
    } catch (err) {
      console.error('Session refresh error:', err);
      return null;
    }
  }, []);

  return {
    updateAuthState,
    refreshSession
  };
};
