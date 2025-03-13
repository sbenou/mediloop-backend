
import { useCallback } from 'react';
import { supabase, getSessionFromStorage } from '@/lib/supabase';
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

      const { profile, permissions } = await fetchAndSetProfile(session.user.id);

      if (!profile) {
        console.error('No profile found after fetch, clearing auth state');
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
          }
        } catch (retryError) {
          console.error('Error in profile creation retry:', retryError);
        }
        
        // If we still don't have a profile, clear auth state
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
        
        // Clear session as well to force a new login
        try {
          await supabase.auth.signOut();
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

      setAuth({
        user: session.user,
        profile,
        permissions,
        isLoading: false,
      });

    } catch (error) {
      console.error('Error in updateAuthState:', error);
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
      
      // Check in storage first
      const storedSession = getSessionFromStorage();
      
      if (!storedSession) {
        // Try to get from Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          return null;
        }
        
        if (!data.session) {
          // Try to refresh
          console.log('No session found, attempting refresh...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            console.warn('Unable to refresh session:', refreshError);
            return null;
          }
          
          console.log('Session refreshed successfully');
          return refreshData.session;
        }
        
        return data.session;
      }
      
      return storedSession;
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
