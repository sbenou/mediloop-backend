
import { useCallback } from 'react';
import { supabase, getSessionFromStorage, clearAllAuthStorage } from '@/lib/supabase';
import useProfileFetch from './useProfileFetch';
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { storeSession } from '@/lib/auth/sessionUtils';
import { toast } from '@/components/ui/use-toast';

export const useSessionManagement = () => {
  const setAuth = useSetRecoilState(authState);
  const { profile, loading, error } = useProfileFetch(undefined);
  
  const fetchUserProfile = async (userId: string) => {
    try {
      // Use a simpler profile fetch approach
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        return { profile: null, permissions: [] };
      }
      
      return { 
        profile: data || null, 
        permissions: [] // Default empty permissions
      };
    } catch (err) {
      console.error("Profile fetch error:", err);
      return { profile: null, permissions: [] };
    }
  };
  
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
      
      // First update with loading state
      setAuth(prev => ({
        ...prev,
        user: session.user,
        isLoading: true,
      }));

      // Use a simpler validation approach to avoid potential deadlocks
      try {
        const { error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Token validation error:', userError);
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
      } catch (tokenError) {
        console.error('Token validation failed:', tokenError);
        clearAllAuthStorage();
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
        return;
      }

      // Fetch the user profile with a timeout to prevent hanging
      let profileFetchCompleted = false;
      
      // Create a promise that resolves after the fetch completes or times out
      const profilePromise = new Promise<{profile: any, permissions: string[]}>(async (resolve) => {
        try {
          const result = await fetchUserProfile(session.user.id);
          profileFetchCompleted = true;
          resolve(result);
        } catch (err) {
          console.error('Error in profile fetch:', err);
          profileFetchCompleted = true;
          resolve({ profile: null, permissions: [] });
        }
      });
      
      // Create a timeout promise
      const timeoutPromise = new Promise<{profile: null, permissions: string[]}>(resolve => {
        setTimeout(() => {
          if (!profileFetchCompleted) {
            console.warn('Profile fetch timed out after 5 seconds');
            resolve({ profile: null, permissions: [] });
          }
        }, 5000);
      });
      
      // Race the profile fetch against the timeout
      const { profile, permissions } = await Promise.race([profilePromise, timeoutPromise]);

      if (!profile) {
        console.error('No profile found after fetch or timeout');
        setAuth({
          user: session.user,
          profile: null,
          permissions: [],
          isLoading: false,
        });
        return;
      }

      console.log('Updating auth state with:', {
        userId: session.user.id,
        role: profile.role,
        permissionsCount: permissions.length
      });

      // Set final auth state
      setAuth({
        user: session.user,
        profile,
        permissions,
        isLoading: false,
      });

    } catch (error) {
      console.error('Error in updateAuthState:', error);
      
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
  }, [setAuth]);

  const refreshSession = useCallback(async () => {
    try {
      console.log('Attempting to refresh session...');
      
      // Try to refresh the session with a timeout to prevent hanging
      const refreshPromise = new Promise<any>(async (resolve) => {
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (!refreshError && refreshData.session) {
            console.log('Session refreshed successfully via API');
            storeSession(refreshData.session);
            resolve(refreshData.session);
            return;
          }
          
          // Try to get from storage if refresh failed
          const storedSession = getSessionFromStorage();
          if (storedSession) {
            console.log('Using stored session after refresh failure');
            resolve(storedSession);
            return;
          }
          
          resolve(null);
        } catch (e) {
          console.error('Error in refresh session:', e);
          resolve(null);
        }
      });
      
      // Create a timeout promise
      const timeoutPromise = new Promise<null>(resolve => {
        setTimeout(() => {
          console.warn('Session refresh timed out after 3 seconds');
          resolve(null);
        }, 3000);
      });
      
      // Race the refresh against the timeout
      return await Promise.race([refreshPromise, timeoutPromise]);
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
