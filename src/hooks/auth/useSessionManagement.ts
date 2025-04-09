
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
      console.log('No session or user, clearing auth state');
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
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Token validation error:', userError);
          throw userError;
        }
        
        if (!userData.user || userData.user.id !== session.user.id) {
          console.error('User ID mismatch or missing user data');
          throw new Error('User identity validation failed');
        }
        
        console.log('Token validation successful for user:', userData.user.id);
      } catch (tokenError) {
        console.error('Token validation failed:', tokenError);
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
        console.error('No profile found after fetch, trying to create one');
        // Try to create profile one last time if it doesn't exist
        try {
          const userData = session.user;
          const role = userData.user_metadata?.role || 'patient';
          const fullName = userData.user_metadata?.full_name || userData.user_metadata?.name || 'User';
          
          await supabase.rpc('create_profile_secure', {
            user_id: userData.id,
            user_role: role,
            user_full_name: fullName,
            user_email: userData.email || '',
            user_license_number: userData.user_metadata?.license_number || null,
          });
          
          // Try to fetch again after creation
          const retryFetch = await fetchAndSetProfile(session.user.id);
          
          if (retryFetch.profile) {
            console.log('Successfully created and fetched profile on retry');
            setAuth({
              user: session.user,
              profile: retryFetch.profile,
              permissions: retryFetch.permissions,
              isLoading: false,
            });
            return;
          } else {
            console.error('Still no profile after retry creation');
          }
        } catch (retryError) {
          console.error('Error in profile creation retry:', retryError);
        }
        
        // If we still don't have a profile, clear auth state and force re-login
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
        
        // Clear session as well to force a new login
        try {
          clearAllAuthStorage();
          await supabase.auth.signOut({ scope: 'local' });
        } catch (signOutError) {
          console.error('Error signing out after profile fetch failure:', signOutError);
        }
        
        toast({
          variant: "destructive",
          title: "Profile Error",
          description: "Unable to load your profile. Please try logging in again.",
        });
        return;
      }

      console.log('Updating auth state with:', {
        userId: session.user.id,
        role: profile.role,
        permissionsCount: permissions.length
      });

      // Add a slight delay to ensure state updates properly before any navigation
      setTimeout(() => {
        setAuth({
          user: session.user,
          profile,
          permissions,
          isLoading: false,
        });
      }, 100);

    } catch (error) {
      console.error('Error in updateAuthState:', error);
      
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
  }, [fetchAndSetProfile, setAuth]);

  const refreshSession = useCallback(async () => {
    try {
      console.log('Attempting to refresh session...');
      
      // First try to completely refresh token to get a clean session
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError && refreshData.session) {
          console.log('Session refreshed successfully via API');
          storeSession(refreshData.session);
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
          storeSession(refreshData.session);
          return refreshData.session;
        }
        
        storeSession(data.session);
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
          
          storeSession(refreshData.session);
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
