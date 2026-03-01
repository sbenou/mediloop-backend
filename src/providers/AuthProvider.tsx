import { useEffect, useRef } from "react";
import { useSetRecoilState } from "recoil";
import { supabase, getSessionFromStorage } from "@/lib/supabase";
import { authState } from "@/store/auth/atoms";
import { toast } from "@/components/ui/use-toast";
import { useSessionManagement } from "@/hooks/auth/useSessionManagement";
import { useVisibilityChange } from "@/hooks/auth/useVisibilityChange";
import { useStorageEvents } from "@/hooks/auth/useStorageEvents";
import { useSessionPolling } from "@/hooks/auth/useSessionPolling";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setAuth = useSetRecoilState(authState);
  const { updateAuthState } = useSessionManagement();
  const { handleVisibilityChange } = useVisibilityChange();
  const { handleStorageChange, handleTokenUpdate } = useStorageEvents();
  const initialized = useRef(false);

  useSessionPolling();

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        console.log("[AuthProvider] Starting auth initialization", {
          timestamp: new Date().toISOString(),
        });

        setAuth((prev) => ({ ...prev, isLoading: true }));

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
              console.log("[AuthProvider] Processing TOKEN_REFRESHED event");
              await updateAuthState(session);
            }
          },
        );

        // Check for stored session
        const storedSession = getSessionFromStorage();

        if (storedSession && mounted) {
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

        // Get fresh session from API
        console.log("[AuthProvider] Fetching fresh session from API");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

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
              await supabase.auth.refreshSession();
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
