/**
 * Session Refresh V2 Hook
 * Automatic token refresh with exponential backoff
 */

import { useEffect, useRef, useCallback } from "react";
import { authClientV2, isRateLimitError } from "../lib/authClientV2";
import { featureFlags } from "../lib/featureFlags";

interface SessionRefreshOptions {
  enabled?: boolean;
  refreshThreshold?: number; // minutes before expiry to refresh
  onTokenRefreshed?: (accessToken: string) => void;
  onRefreshFailed?: (error: Error) => void;
  onSessionExpired?: () => void;
}

const DEFAULT_REFRESH_THRESHOLD = 5; // Refresh 5 minutes before expiry
const TOKEN_EXPIRY_MINUTES = 15; // Access token expires in 15 minutes

/**
 * Decode JWT to get expiration time
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
}

export function useSessionRefreshV2(
  accessToken: string | null,
  refreshToken: string | null,
  options: SessionRefreshOptions = {},
) {
  const {
    enabled = true,
    refreshThreshold = DEFAULT_REFRESH_THRESHOLD,
    onTokenRefreshed,
    onRefreshFailed,
    onSessionExpired,
  } = options;

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  /**
   * Schedule token refresh
   */
  const scheduleRefresh = useCallback(
    (token: string) => {
      if (!featureFlags.isEnabled("useSessionRefreshV2") || !enabled) {
        return;
      }

      // Clear existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      const expiry = getTokenExpiry(token);
      if (!expiry) {
        console.warn("Could not parse token expiry, using default");
        // Fallback: refresh after 10 minutes
        const fallbackDelay =
          (TOKEN_EXPIRY_MINUTES - refreshThreshold) * 60 * 1000;
        refreshTimeoutRef.current = setTimeout(
          () => performRefresh(),
          fallbackDelay,
        );
        return;
      }

      const now = Date.now();
      const timeUntilExpiry = expiry - now;
      const refreshDelay = timeUntilExpiry - refreshThreshold * 60 * 1000;

      if (refreshDelay <= 0) {
        // Token is expired or about to expire, refresh immediately
        performRefresh();
      } else {
        // Schedule refresh
        refreshTimeoutRef.current = setTimeout(
          () => performRefresh(),
          refreshDelay,
        );
      }
    },
    [enabled, refreshThreshold],
  );

  /**
   * Perform token refresh with exponential backoff
   */
  const performRefresh = useCallback(async () => {
    if (isRefreshingRef.current || !refreshToken) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      const response = await authClientV2.refreshToken(refreshToken);

      if (response.success && response.data?.accessToken) {
        const newAccessToken = response.data.accessToken;

        // Reset retry count on success
        retryCountRef.current = 0;

        // Notify parent component
        onTokenRefreshed?.(newAccessToken);

        // Schedule next refresh
        scheduleRefresh(newAccessToken);
      } else {
        throw new Error(response.error || "Token refresh failed");
      }
    } catch (error) {
      console.error("Token refresh failed:", error);

      if (isRateLimitError(error)) {
        // Rate limited - retry after specified time
        const retryDelay = (error.retryAfter || 60) * 1000;
        setTimeout(() => {
          isRefreshingRef.current = false;
          performRefresh();
        }, retryDelay);
      } else {
        // Exponential backoff for other errors
        retryCountRef.current++;

        if (retryCountRef.current <= maxRetries) {
          const backoffDelay = Math.min(
            1000 * Math.pow(2, retryCountRef.current),
            30000,
          );
          setTimeout(() => {
            isRefreshingRef.current = false;
            performRefresh();
          }, backoffDelay);
        } else {
          // Max retries reached - session expired
          onRefreshFailed?.(
            error instanceof Error ? error : new Error("Token refresh failed"),
          );
          onSessionExpired?.();
        }
      }
    } finally {
      if (retryCountRef.current === 0 || retryCountRef.current > maxRetries) {
        isRefreshingRef.current = false;
      }
    }
  }, [
    refreshToken,
    onTokenRefreshed,
    onRefreshFailed,
    onSessionExpired,
    scheduleRefresh,
  ]);

  /**
   * Initialize refresh schedule when token changes
   */
  useEffect(() => {
    if (accessToken && refreshToken && enabled) {
      scheduleRefresh(accessToken);
    }

    // Cleanup
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [accessToken, refreshToken, enabled, scheduleRefresh]);

  /**
   * Manual refresh trigger
   */
  const manualRefresh = useCallback(async () => {
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    await performRefresh();
  }, [performRefresh, refreshToken]);

  return {
    manualRefresh,
    isRefreshing: isRefreshingRef.current,
  };
}
