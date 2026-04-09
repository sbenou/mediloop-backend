import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { supabase, getSessionFromStorage } from "@/lib/supabase";
import { authState } from "@/store/auth/atoms";
import { useSessionManagement } from "@/hooks/auth/useSessionManagement";
import { useVisibilityChange } from "@/hooks/auth/useVisibilityChange";
import { useStorageEvents } from "@/hooks/auth/useStorageEvents";
import { useSessionPolling } from "@/hooks/auth/useSessionPolling";
import { V2_SESSION_STORAGE_KEYS } from "@/lib/auth/v2SessionStorage";
import {
  hasV2SessionStorage,
  readBootstrapProfileFromV2Storage,
} from "@/lib/auth/bootstrapV2Profile";
const SUPABASE_SESSION_WAIT_MS = 8_000;
const AUTH_INIT_WATCHDOG_MS = 20_000;

async function getSupabaseSessionBounded() {
  try {
    return await Promise.race([
      supabase.auth.getSession(),
      new Promise<Awaited<ReturnType<typeof supabase.auth.getSession>>>(
        (_, reject) => {
          window.setTimeout(
            () => reject(new Error("supabase.getSession timeout")),
            SUPABASE_SESSION_WAIT_MS,
          );
        },
      ),
    ]);
  } catch {
    return {
      data: { session: null },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.getSession>>;
  }
}

async function refreshSupabaseSessionBounded() {
  try {
    return await Promise.race([
      supabase.auth.refreshSession(),
      new Promise<Awaited<ReturnType<typeof supabase.auth.refreshSession>>>(
        (_, reject) => {
          window.setTimeout(
            () => reject(new Error("refreshSession timeout")),
            SUPABASE_SESSION_WAIT_MS,
          );
        },
      ),
    ]);
  } catch {
    return {
      data: { session: null, user: null },
      error: new Error("timeout"),
    } as Awaited<ReturnType<typeof supabase.auth.refreshSession>>;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);
  const { updateAuthState, hydrateV2FromStorage } = useSessionManagement();
  const { handleVisibilityChange } = useVisibilityChange();
  const { handleStorageChange, handleTokenUpdate } = useStorageEvents();
  useSessionPolling();

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      const watchdog = window.setTimeout(() => {
        if (!mounted) return;
        setAuth((prev) =>
          prev.isLoading ? { ...prev, isLoading: false } : prev,
        );
        console.error(
          "[AuthProvider] Auth init watchdog: forced isLoading false after stall",
        );
      }, AUTH_INIT_WATCHDOG_MS);

      const clearWatchdog = () => window.clearTimeout(watchdog);

      try {
        console.log("[AuthProvider] Starting auth initialization", {
          timestamp: new Date().toISOString(),
        });

        // V2 (Neon JWT): apply local bootstrap immediately so Dashboard is not blocked on
        // default Recoil isLoading:true, Strict Mode re-runs, or async profile hydration.
        if (hasV2SessionStorage()) {
          const v2Uid =
            localStorage.getItem(V2_SESSION_STORAGE_KEYS.USER_ID) ?? "";
          const boot = readBootstrapProfileFromV2Storage(v2Uid);
          if (boot) {
            setAuth({ ...boot, isLoading: false });
          } else {
            setAuth((prev) => ({ ...prev, isLoading: true }));
          }
        } else {
          setAuth((prev) => ({ ...prev, isLoading: true }));
        }

        // Set up auth state listener FIRST to catch all events
        authSubscription = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;

            console.log("[AuthProvider] Auth state changed:", {
              event,
              userId: session?.user?.id,
              timestamp: new Date().toISOString(),
            });

            if (event === "SIGNED_IN") {
              if (hasV2SessionStorage()) {
                console.log(
                  "[AuthProvider] Skipping Supabase SIGNED_IN; V2 JWT session is authoritative",
                );
                return;
              }
              console.log("[AuthProvider] Processing SIGNED_IN event");
              await updateAuthState(session);
            } else if (event === "SIGNED_OUT") {
              console.log("[AuthProvider] Processing SIGNED_OUT event");
              setAuth({
                user: null,
                profile: null,
                permissions: [],
                isLoading: false,
              });
            } else if (event === "TOKEN_REFRESHED") {
              if (hasV2SessionStorage()) {
                console.log(
                  "[AuthProvider] Skipping Supabase TOKEN_REFRESHED; V2 JWT session is authoritative",
                );
                return;
              }
              console.log("[AuthProvider] Processing TOKEN_REFRESHED event");
              await updateAuthState(session);
            }
          },
        );

        // Check for stored session
        const storedSession = getSessionFromStorage();

        if (storedSession && mounted && !hasV2SessionStorage()) {
          console.log("[AuthProvider] Found stored session:", {
            userId: storedSession.user?.id,
            timestamp: new Date().toISOString(),
          });

          setAuth((prev) => ({
            ...prev,
            user: storedSession.user,
            isLoading: true,
          }));
        }

        // V2 password/OAuth (Neon JWT): tokens live in localStorage, not Supabase
        const v2Hydrated = await hydrateV2FromStorage();
        if (!mounted) return;
        if (v2Hydrated) {
          console.log(
            "[AuthProvider] Session restored from V2 JWT (backend profile loaded)",
          );
          clearWatchdog();
          return;
        }

        if (hasV2SessionStorage()) {
          const v2Uid =
            localStorage.getItem(V2_SESSION_STORAGE_KEYS.USER_ID) ?? "";
          const boot = readBootstrapProfileFromV2Storage(v2Uid);
          if (boot && mounted) {
            setAuth({ ...boot, isLoading: false });
            console.warn(
              "[AuthProvider] V2 tokens present; applied local user bootstrap (avoid Supabase init hang)",
            );
            return;
          }
        }

        // Get fresh session from API
        console.log("[AuthProvider] Fetching fresh session from API");
        const {
          data: { session },
          error,
        } = await getSupabaseSessionBounded();

        if (error) {
          console.error(
            "[AuthProvider] Error getting session from API:",
            error,
          );
          if (mounted) {
            setAuth((prev) => ({ ...prev, isLoading: false }));
          }
          return;
        }

        if (!mounted) return;

        if (session) {
          console.log("[AuthProvider] Using API session for user:", {
            userId: session.user.id,
            timestamp: new Date().toISOString(),
          });
          await updateAuthState(session);
        } else if (storedSession?.user?.id) {
          console.log(
            "[AuthProvider] API returned no session but found one in storage",
          );
          // Try to refresh the session
          try {
            const { data: refreshData, error: refreshError } =
              await refreshSupabaseSessionBounded();
            if (refreshError || !refreshData.session) {
              console.log(
                "[AuthProvider] Session refresh failed, clearing stored session",
              );
              setAuth({
                user: null,
                profile: null,
                permissions: [],
                isLoading: false,
              });
            } else {
              console.log("[AuthProvider] Session refreshed successfully");
              await updateAuthState(refreshData.session);
            }
          } catch (refreshError) {
            console.error(
              "[AuthProvider] Error refreshing session:",
              refreshError,
            );
            setAuth({
              user: null,
              profile: null,
              permissions: [],
              isLoading: false,
            });
          }
        } else {
          console.log(
            "[AuthProvider] No session found, user is not authenticated",
          );
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        }
      } catch (error) {
        console.error(
          "[AuthProvider] Error during auth initialization:",
          error,
        );
        if (mounted) {
          setAuth({
            user: null,
            profile: null,
            permissions: [],
            isLoading: false,
          });
        }
      } finally {
        clearWatchdog();
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      console.log("[AuthProvider] Cleaning up auth provider");
      mounted = false;
      if (authSubscription?.subscription) {
        authSubscription.subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array - only run once

  return <>{children}</>;
};
