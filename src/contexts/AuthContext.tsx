/**
 * AuthContext V2 - Hybrid System
 * Supports both legacy Supabase and new V2 Neon backend
 * Gradually migrates features based on feature flags
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { RecoilRoot } from "recoil";
import { useSessionManagement } from "@/hooks/auth/useSessionManagement";
import { useSessionPolling } from "@/hooks/auth/useSessionPolling";
import { useSessionRefreshV2 } from "@/hooks/useSessionRefreshV2";
import { useMultiTabSyncV2 } from "@/hooks/useMultiTabSyncV2";
import { supabase } from "@/lib/supabase";
import { authClientV2 } from "@/lib/authClientV2";
import { featureFlags } from "@/lib/featureFlags";
import { toast } from "@/hooks/use-toast";
import { V2_SESSION_STORAGE_KEYS } from "@/lib/auth/v2SessionStorage";

const STORAGE_KEYS = V2_SESSION_STORAGE_KEYS;

interface SessionData {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  timestamp: number;
}

// Create context that will provide authentication functionality
const AuthContext = createContext<null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider - Hybrid implementation supporting both legacy and V2
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { updateAuthState } = useSessionManagement();

  // V2 Session State
  const [v2Session, setV2Session] = useState<SessionData>({
    accessToken: null,
    refreshToken: null,
    userId: null,
    timestamp: Date.now(),
  });

  // Check if V2 features are enabled
  const isV2SessionEnabled = featureFlags.isEnabled("useSessionRefreshV2");
  const isV2MultiTabEnabled = featureFlags.isEnabled("useMultiTabSyncV2");

  /**
   * Load session from storage (V2)
   */
  const loadV2Session = useCallback(() => {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);

      if (accessToken && refreshToken && userId) {
        console.log("[AuthContext V2] Loaded session from storage");
        setV2Session({
          accessToken,
          refreshToken,
          userId,
          timestamp: Date.now(),
        });
        return true;
      }
    } catch (error) {
      console.error("[AuthContext V2] Failed to load session:", error);
    }
    return false;
  }, []);

  /**
   * Save session to storage (V2)
   */
  const saveV2Session = useCallback((session: SessionData) => {
    try {
      if (session.accessToken && session.refreshToken && session.userId) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken);
        localStorage.setItem(STORAGE_KEYS.USER_ID, session.userId);
        console.log("[AuthContext V2] Session saved to storage");
      }
    } catch (error) {
      console.error("[AuthContext V2] Failed to save session:", error);
    }
  }, []);

  /**
   * Clear session from storage (V2)
   */
  const clearV2Session = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      console.log("[AuthContext V2] Session cleared from storage");
    } catch (error) {
      console.error("[AuthContext V2] Failed to clear session:", error);
    }
  }, []);

  /**
   * Handle token refresh success (V2)
   */
  const handleTokenRefreshed = useCallback(
    (newAccessToken: string) => {
      console.log("[AuthContext V2] Token refreshed successfully");
      setV2Session((prev) => {
        const updated = {
          ...prev,
          accessToken: newAccessToken,
          timestamp: Date.now(),
        };
        saveV2Session(updated);
        return updated;
      });
    },
    [saveV2Session],
  );

  /**
   * Handle token refresh failure (V2)
   */
  const handleRefreshFailed = useCallback((error: Error) => {
    console.error("[AuthContext V2] Token refresh failed:", error);
    toast({
      variant: "destructive",
      title: "Session Error",
      description: "Failed to refresh your session. Please log in again.",
    });
  }, []);

  /**
   * Handle session expired (V2)
   */
  const handleSessionExpired = useCallback(() => {
    console.log("[AuthContext V2] Session expired, logging out");
    clearV2Session();
    setV2Session({
      accessToken: null,
      refreshToken: null,
      userId: null,
      timestamp: Date.now(),
    });

    // Also clear legacy session
    updateAuthState(null);

    toast({
      variant: "destructive",
      title: "Session Expired",
      description: "Your session has expired. Please log in again.",
    });

    // Redirect to login
    window.location.href = "/auth-v2/login";
  }, [clearV2Session, updateAuthState]);

  /**
   * Handle session update from other tabs (V2)
   */
  const handleSessionUpdate = useCallback(
    (session: SessionData) => {
      console.log("[AuthContext V2] Session updated from another tab");
      setV2Session(session);
      saveV2Session(session);
    },
    [saveV2Session],
  );

  /**
   * Handle session clear from other tabs (V2)
   */
  const handleSessionClear = useCallback(() => {
    console.log(
      "[AuthContext V2] Session cleared from another tab, logging out",
    );
    handleSessionExpired();
  }, [handleSessionExpired]);

  // Initialize V2 session refresh hook
  useSessionRefreshV2(v2Session.accessToken, v2Session.refreshToken, {
    enabled: isV2SessionEnabled,
    onTokenRefreshed: handleTokenRefreshed,
    onRefreshFailed: handleRefreshFailed,
    onSessionExpired: handleSessionExpired,
  });

  // Initialize V2 multi-tab sync hook
  useMultiTabSyncV2(v2Session, {
    enabled: isV2MultiTabEnabled,
    onSessionUpdate: handleSessionUpdate,
    onSessionClear: handleSessionClear,
  });

  // Legacy session polling (will be phased out)
  useSessionPolling();

  // On initial load, check for existing session
  useEffect(() => {
    let isMounted = true;
    let initTimeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log("[AuthContext] Starting auth initialization");

        // Try V2 session first if enabled
        if (isV2SessionEnabled) {
          const hasV2Session = loadV2Session();
          if (hasV2Session) {
            console.log("[AuthContext] Using V2 session");
            return;
          }
        }

        // Fall back to legacy Supabase session
        console.log("[AuthContext] Checking legacy Supabase session");
        const sessionPromise = supabase.auth
          .getSession()
          .then(({ data }) => data.session);
        const timeoutPromise = new Promise<null>((resolve) => {
          initTimeoutId = setTimeout(() => {
            console.warn(
              "[AuthContext] Auth initialization timeout (8 seconds)",
            );
            resolve(null);
          }, 8000);
        });

        const session = await Promise.race([sessionPromise, timeoutPromise]);

        if (!isMounted) return;

        if (session) {
          console.log(
            "[AuthContext] Found legacy session, updating auth state",
          );
          setTimeout(() => {
            if (isMounted) {
              updateAuthState(session);
            }
          }, 0);
        } else {
          console.log("[AuthContext] No session found");
          if (isMounted) {
            updateAuthState(null);
          }
        }
      } catch (error) {
        console.error("[AuthContext] Error initializing auth:", error);
        if (isMounted) {
          updateAuthState(null);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes from other tabs
    const handleStorageEvent = (event: StorageEvent) => {
      // V2 session changes
      if (event.key && Object.values(STORAGE_KEYS).includes(event.key)) {
        console.log("[AuthContext V2] Token changed in another tab");
        if (isV2SessionEnabled) {
          loadV2Session();
        }
      }

      // Legacy Supabase changes
      if (event.key?.includes("auth-token")) {
        console.log("[AuthContext Legacy] Token changed in another tab");
        setTimeout(async () => {
          if (!isMounted) return;
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session && isMounted) {
            updateAuthState(session);
          } else if (isMounted) {
            updateAuthState(null);
          }
        }, 0);
      }
    };

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageEvent);
      if (initTimeoutId) clearTimeout(initTimeoutId);
    };
  }, [updateAuthState, isV2SessionEnabled, loadV2Session]);

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
};

/**
 * Wrap the AuthProvider with RecoilRoot
 */
export const AuthProviderWithRecoil: React.FC<AuthProviderProps> = ({
  children,
}) => {
  return (
    <RecoilRoot>
      <AuthProvider>{children}</AuthProvider>
    </RecoilRoot>
  );
};

// Export a hook for using the auth context
export const useAuthContext = () => {
  return useContext(AuthContext);
};
