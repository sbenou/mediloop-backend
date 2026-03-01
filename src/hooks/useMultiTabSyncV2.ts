/**
 * Multi-Tab Session Sync V2 Hook
 * Synchronizes authentication state across browser tabs
 */

import { useEffect, useCallback, useRef } from "react";
import { featureFlags } from "../lib/featureFlags";

interface SessionData {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  timestamp: number;
}

interface MultiTabSyncOptions {
  enabled?: boolean;
  onSessionUpdate?: (session: SessionData) => void;
  onSessionClear?: () => void;
}

const STORAGE_KEY = "mediloop_session_sync";
const SYNC_CHANNEL = "mediloop_session_channel";

export function useMultiTabSyncV2(
  currentSession: SessionData,
  options: MultiTabSyncOptions = {},
) {
  const { enabled = true, onSessionUpdate, onSessionClear } = options;

  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastUpdateRef = useRef<number>(0);

  /**
   * Broadcast session update to other tabs
   */
  const broadcastSessionUpdate = useCallback(
    (session: SessionData) => {
      if (!featureFlags.isEnabled("useMultiTabSyncV2") || !enabled) {
        return;
      }

      try {
        // Update localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

        // Broadcast to other tabs via BroadcastChannel
        if (channelRef.current) {
          channelRef.current.postMessage({
            type: "SESSION_UPDATE",
            session,
          });
        }
      } catch (error) {
        console.error("Failed to broadcast session update:", error);
      }
    },
    [enabled],
  );

  /**
   * Broadcast session logout to other tabs
   */
  const broadcastSessionClear = useCallback(() => {
    if (!featureFlags.isEnabled("useMultiTabSyncV2") || !enabled) {
      return;
    }

    try {
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);

      // Broadcast to other tabs
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: "SESSION_CLEAR",
        });
      }
    } catch (error) {
      console.error("Failed to broadcast session clear:", error);
    }
  }, [enabled]);

  /**
   * Handle incoming messages from other tabs
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (!featureFlags.isEnabled("useMultiTabSyncV2") || !enabled) {
        return;
      }

      const { type, session } = event.data;

      if (type === "SESSION_UPDATE" && session) {
        // Prevent infinite loops by checking timestamp
        if (session.timestamp > lastUpdateRef.current) {
          lastUpdateRef.current = session.timestamp;
          onSessionUpdate?.(session);
        }
      } else if (type === "SESSION_CLEAR") {
        onSessionClear?.();
      }
    },
    [enabled, onSessionUpdate, onSessionClear],
  );

  /**
   * Handle storage events (fallback for older browsers)
   */
  const handleStorageEvent = useCallback(
    (event: StorageEvent) => {
      if (!featureFlags.isEnabled("useMultiTabSyncV2") || !enabled) {
        return;
      }

      if (event.key === STORAGE_KEY) {
        if (event.newValue) {
          try {
            const session = JSON.parse(event.newValue) as SessionData;
            if (session.timestamp > lastUpdateRef.current) {
              lastUpdateRef.current = session.timestamp;
              onSessionUpdate?.(session);
            }
          } catch (error) {
            console.error("Failed to parse session from storage:", error);
          }
        } else {
          // Storage was cleared
          onSessionClear?.();
        }
      }
    },
    [enabled, onSessionUpdate, onSessionClear],
  );

  /**
   * Initialize BroadcastChannel and listeners
   */
  useEffect(() => {
    if (!featureFlags.isEnabled("useMultiTabSyncV2") || !enabled) {
      return;
    }

    // Create BroadcastChannel
    try {
      channelRef.current = new BroadcastChannel(SYNC_CHANNEL);
      channelRef.current.onmessage = handleMessage;
    } catch (error) {
      console.warn(
        "BroadcastChannel not supported, falling back to storage events",
      );
    }

    // Listen to storage events (fallback)
    window.addEventListener("storage", handleStorageEvent);

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [enabled, handleMessage, handleStorageEvent]);

  /**
   * Sync current session when it changes
   */
  useEffect(() => {
    if (!featureFlags.isEnabled("useMultiTabSyncV2") || !enabled) {
      return;
    }

    // Update timestamp and broadcast
    const sessionWithTimestamp = {
      ...currentSession,
      timestamp: Date.now(),
    };

    lastUpdateRef.current = sessionWithTimestamp.timestamp;
    broadcastSessionUpdate(sessionWithTimestamp);
  }, [
    currentSession.accessToken,
    currentSession.refreshToken,
    currentSession.userId,
    enabled,
    broadcastSessionUpdate,
  ]);

  return {
    broadcastSessionUpdate,
    broadcastSessionClear,
  };
}
