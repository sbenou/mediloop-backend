
import { useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { supabase } from '@/lib/supabase';
import { authState } from '@/store/auth/atoms';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { UserProfile } from '@/types/user';

export const useSessionManagement = () => {
  const setAuth = useSetRecoilState(authState);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[useSessionManagement] Error refreshing session:', error);
        throw error;
      }
      
      return session;
    } catch (error) {
      console.error('[useSessionManagement] Exception refreshing session:', error);
      return null;
    }
  }, []);

  const updateAuthState = useCallback(async (session: Session | null) => {
    try {
      if (!session || !session.user) {
        console.log('[useSessionManagement] No valid session data, clearing auth state');
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
        return;
      }

      console.log('[useSessionManagement] Updating auth state for user:', session.user.id);
      
      // Fetch profile data for the authenticated user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError && !profileError.message.includes('No rows found')) {
        console.error('[useSessionManagement] Error fetching profile:', profileError);
        // Don't throw here, we can still proceed with user data even without profile
      }
      
      // Set minimal profile data if none exists
      const profile: Partial<UserProfile> = profileData || {
        id: session.user.id,
        role: session.user.user_metadata?.role || 'patient',
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name || null,
      };
      
      // Update auth state with user and profile data
      setAuth(prev => ({
        ...prev,
        user: session.user,
        profile: profile as UserProfile,
        isLoading: false,
        permissions: prev.permissions, // Keep existing permissions
      }));
      
    } catch (error) {
      console.error('[useSessionManagement] Error updating auth state:', error);
      toast.error("Failed to load user profile");
      
      // Still update with basic user data to maintain session
      if (session?.user) {
        setAuth({
          user: session.user,
          profile: {
            id: session.user.id,
            role: session.user.user_metadata?.role || 'patient',
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || null,
          } as UserProfile,
          permissions: [],
          isLoading: false,
        });
      } else {
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
      }
    }
  }, [setAuth]);

  return {
    refreshSession,
    updateAuthState,
  };
};
