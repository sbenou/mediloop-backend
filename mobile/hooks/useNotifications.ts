/**
 * useNotifications Hook
 *
 * React hook for managing push notifications in your app
 * Usage: const { hasPermission, registerToken, unregisterToken } = useNotifications(user);
 */

import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as pushNotificationService from "../services/pushNotificationService";

interface User {
  id: string;
  authToken: string;
  role:
    | "doctor"
    | "pharmacist"
    | "nurse"
    | "patient"
    | "hospital_admin"
    | "clinic_admin";
}

interface UseNotificationsResult {
  hasPermission: boolean;
  isRegistered: boolean;
  registerToken: () => Promise<boolean>;
  unregisterToken: () => Promise<boolean>;
}

export function useNotifications(
  user: User | null,
  onNotificationReceived?: (notification: any) => void,
  onNotificationOpened?: (notification: any) => void,
): UseNotificationsResult {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Register FCM token when user logs in
  const registerToken = async (): Promise<boolean> => {
    if (!user) {
      console.error("Cannot register token: no user");
      return false;
    }

    const success = await pushNotificationService.registerFCMToken(
      user.id,
      user.authToken,
    );

    setIsRegistered(success);
    return success;
  };

  // Unregister FCM token when user logs out
  const unregisterToken = async (): Promise<boolean> => {
    if (!user) {
      console.error("Cannot unregister token: no user");
      return false;
    }

    const success = await pushNotificationService.unregisterFCMToken(
      user.id,
      user.authToken,
    );

    setIsRegistered(false);
    return success;
  };

  // Setup notification handlers on mount
  useEffect(() => {
    const cleanup = pushNotificationService.setupNotificationHandlers(
      onNotificationReceived,
      onNotificationOpened,
    );

    return cleanup;
  }, [onNotificationReceived, onNotificationOpened]);

  // Setup token refresh handler
  useEffect(() => {
    if (!user) return;

    const cleanup = pushNotificationService.setupTokenRefreshHandler(
      user.id,
      user.authToken,
    );

    return cleanup;
  }, [user]);

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      const granted = await pushNotificationService.requestPermissions();
      setHasPermission(granted);
    };

    checkPermissions();
  }, []);

  // Auto-register token when user logs in
  useEffect(() => {
    if (user && hasPermission && !isRegistered) {
      registerToken();
    }
  }, [user, hasPermission]);

  // Handle online/offline status for doctors, pharmacists, nurses
  useEffect(() => {
    if (!user) return;

    const supportedRoles = ["doctor", "pharmacist", "nurse"];
    if (!supportedRoles.includes(user.role)) return;

    let appState = AppState.currentState;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // App went to background
      if (
        appState.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        await pushNotificationService.updateOnlineStatus(
          user.id,
          false, // offline
          user.authToken,
        );
      }

      // App came to foreground
      if (appState.match(/inactive|background/) && nextAppState === "active") {
        await pushNotificationService.updateOnlineStatus(
          user.id,
          true, // online
          user.authToken,
        );
      }

      appState = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    // Mark as online when hook mounts
    pushNotificationService.updateOnlineStatus(user.id, true, user.authToken);

    // Mark as offline when unmounting
    return () => {
      pushNotificationService.updateOnlineStatus(
        user.id,
        false,
        user.authToken,
      );
      subscription.remove();
    };
  }, [user]);

  return {
    hasPermission,
    isRegistered,
    registerToken,
    unregisterToken,
  };
}
