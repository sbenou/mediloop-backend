
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
        setAuth({
          user: null,
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
