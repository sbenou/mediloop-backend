
import { useCallback, useRef } from 'react';
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { storeSession } from '@/lib/auth/sessionUtils';
import { useProfileFetch } from './useProfileFetch';
import type { Session } from '@supabase/supabase-js';

export const useSessionManagement = () => {
  const setAuth = useSetRecoilState(authState);
  const { fetchAndSetProfile } = useProfileFetch();
  const isUpdatingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const updateAuthState = useCallback(async (session: Session | null) => {
    const userId = session?.user?.id;
    
    console.log('[SessionManagement] updateAuthState called with session:', {
      hasSession: !!session,
      userId,
      timestamp: new Date().toISOString()
    });

    // Prevent concurrent updates for the same user
    if (isUpdatingRef.current && lastUserIdRef.current === userId) {
      console.log('[SessionManagement] Already updating auth state for this user, skipping');
      return;
    }

    isUpdatingRef.current = true;
    lastUserIdRef.current = userId || null;

    try {
      if (!session || !userId) {
        console.log('[SessionManagement] No session or user ID, clearing auth state');
        setAuth({
          user: null,
          profile: null,
          permissions: [],
          isLoading: false,
        });
        return;
      }

      // Store session before proceeding
      console.log('[SessionManagement] Storing session before proceeding');
      await storeSession(session);

      // Set initial auth state with user
      console.log('[SessionManagement] Setting initial auth state with user');
      setAuth(prev => ({
        ...prev,
        user: session.user,
        isLoading: true,
      }));

      // Start token validation
      console.log('[SessionManagement] Starting token validation');
      
      try {
        // Fetch profile and permissions
        const { profile, permissions } = await fetchAndSetProfile(userId);
        
        if (profile) {
          console.log('[SessionManagement] Profile fetched successfully, updating auth state');
          setAuth({
            user: session.user,
            profile,
            permissions,
            isLoading: false,
          });
        } else {
          console.log('[SessionManagement] No profile found, setting minimal auth state');
          setAuth({
            user: session.user,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        }
      } catch (profileError) {
        console.error('[SessionManagement] Error fetching profile:', profileError);
        // Don't clear the user, just set profile to null
        setAuth({
          user: session.user,
          profile: null,
          permissions: [],
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('[SessionManagement] Error in updateAuthState:', error);
      setAuth({
        user: null,
        profile: null,
        permissions: [],
        isLoading: false,
      });
    } finally {
      isUpdatingRef.current = false;
    }
  }, [setAuth, fetchAndSetProfile]);

  return { updateAuthState };
};

export default useSessionManagement;
