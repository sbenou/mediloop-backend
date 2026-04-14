import { useCallback, useRef } from "react";
import { useSetRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";
import { storeSession } from "@/lib/auth/sessionUtils";
import {
  fetchProfileForV2Jwt,
  useProfileFetch,
} from "./useProfileFetch";
import type { Session, User } from "@supabase/supabase-js";
import { V2_SESSION_STORAGE_KEYS, clearV2SessionStorageKeys } from "@/lib/auth/v2SessionStorage";
import {
  hasV2SessionStorage,
  readBootstrapProfileFromV2Storage,
} from "@/lib/auth/bootstrapV2Profile";

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

    if (typeof window !== "undefined" && session && hasV2SessionStorage()) {
      const v2Uid = localStorage.getItem(V2_SESSION_STORAGE_KEYS.USER_ID);
      if (v2Uid) {
        const boot = readBootstrapProfileFromV2Storage(v2Uid);
        if (boot) {
          setAuth({ ...boot, isLoading: false });
        } else {
          setAuth((prev) => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuth((prev) => ({ ...prev, isLoading: false }));
      }
      console.log(
        "[SessionManagement] Ignored Supabase session sync; V2 JWT active (cleared loading)",
      );
      return;
    }

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
        const { profile, permissions } = await fetchAndSetProfile(
          userId,
          session.access_token ?? null,
        );
        
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

  /**
   * Cold-start: Recoil has no Supabase session, but V2 login left JWT + user id in localStorage.
   */
  const hydrateV2FromStorage = useCallback(async (): Promise<boolean> => {
    const accessToken =
      localStorage.getItem(V2_SESSION_STORAGE_KEYS.ACCESS_TOKEN) ||
      localStorage.getItem("auth_token");
    const userId = localStorage.getItem(V2_SESSION_STORAGE_KEYS.USER_ID);

    if (!accessToken || !userId) {
      return false;
    }

    const outcome = await fetchProfileForV2Jwt(userId, accessToken);
    if (outcome.status === "unauthorized") {
      clearV2SessionStorageKeys();
      localStorage.removeItem("auth_token");
      localStorage.removeItem("mediloop_session_sync");
      localStorage.removeItem("mediloop_v2_user");
      return false;
    }
    if (outcome.status === "failed") {
      const boot = readBootstrapProfileFromV2Storage(userId);
      if (boot) {
        setAuth({
          user: boot.user,
          profile: boot.profile,
          permissions: boot.permissions,
          isLoading: false,
        });
        console.warn(
          "[SessionManagement] V2 profile API unavailable; bootstrapped from mediloop_v2_user",
        );
        return true;
      }
      return false;
    }

    let email = outcome.profile.email || "";
    if (!email) {
      try {
        const raw = localStorage.getItem("mediloop_v2_user");
        if (raw) {
          const u = JSON.parse(raw) as { email?: string };
          email = u.email || "";
        }
      } catch {
        /* ignore */
      }
    }

    const minimalUser = {
      id: userId,
      email: email || undefined,
    } as unknown as User;

    setAuth({
      user: minimalUser,
      profile: outcome.profile,
      permissions: outcome.permissions,
      isLoading: false,
    });
    console.log("[SessionManagement] Hydrated Recoil from V2 JWT storage");
    return true;
  }, [setAuth]);

  return { updateAuthState, hydrateV2FromStorage };
};

export default useSessionManagement;
