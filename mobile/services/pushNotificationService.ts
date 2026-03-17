/**
 * Push Notification Service (React Native + Expo)
 *
 * Handles FCM setup, token registration, and notification handling
 * for iOS and Android using Expo + Firebase
 */

import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
const FCM_TOKEN_KEY = "@mediloop_fcm_token";

/**
 * Request notification permissions (iOS)
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log("✅ Notification permissions granted");
    } else {
      console.log("❌ Notification permissions denied");
    }

    return enabled;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
}

/**
 * Get FCM token
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    // Check if we have permission (iOS)
    if (Platform.OS === "ios") {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return null;
      }
    }

    // Get FCM token
    const token = await messaging().getToken();

    if (token) {
      console.log("✅ FCM token obtained:", token.substring(0, 20) + "...");

      // Save token locally
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    }

    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

/**
 * Register FCM token with backend
 */
export async function registerFCMToken(
  userId: string,
  authToken: string,
): Promise<boolean> {
  try {
    const fcmToken = await getFCMToken();

    if (!fcmToken) {
      console.error("No FCM token available");
      return false;
    }

    // Send to backend
    const response = await fetch(
      `${API_URL}/api/notifications/register-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId,
          fcmToken,
          platform: Platform.OS,
          deviceId: await getDeviceId(),
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to register FCM token");
    }

    const result = await response.json();
    console.log("✅ FCM token registered with backend");
    console.log("📢 Subscribed to topics:", result.topics);

    return true;
  } catch (error) {
    console.error("Error registering FCM token:", error);
    return false;
  }
}

/**
 * Unregister FCM token (on logout)
 */
export async function unregisterFCMToken(
  userId: string,
  authToken: string,
): Promise<boolean> {
  try {
    const fcmToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);

    if (!fcmToken) {
      console.log("No FCM token to unregister");
      return true;
    }

    // Send to backend
    const response = await fetch(
      `${API_URL}/api/notifications/unregister-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId,
          fcmToken,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to unregister FCM token");
    }

    // Remove from local storage
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);

    console.log("✅ FCM token unregistered");
    return true;
  } catch (error) {
    console.error("Error unregistering FCM token:", error);
    return false;
  }
}

/**
 * Update online status (subscribe/unsubscribe to online topics)
 */
export async function updateOnlineStatus(
  userId: string,
  isOnline: boolean,
  authToken: string,
): Promise<void> {
  try {
    await fetch(`${API_URL}/api/notifications/update-online-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        userId,
        isOnline,
      }),
    });

    console.log(`✅ Online status updated: ${isOnline ? "online" : "offline"}`);
  } catch (error) {
    console.error("Error updating online status:", error);
  }
}

/**
 * Setup notification handlers
 */
export function setupNotificationHandlers(
  onNotificationReceived?: (notification: any) => void,
  onNotificationOpened?: (notification: any) => void,
) {
  // Handle notifications when app is in foreground
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    console.log("📱 Notification received (foreground):", remoteMessage);

    if (onNotificationReceived) {
      onNotificationReceived(remoteMessage);
    }

    // You can show in-app notification here using a library like react-native-toast-notifications
  });

  // Handle notification opened (app was in background/quit)
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log("📱 Notification opened app:", remoteMessage);

    if (onNotificationOpened) {
      onNotificationOpened(remoteMessage);
    }
  });

  // Check if app was opened from a notification (app was quit)
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log(
          "📱 App opened from notification (quit state):",
          remoteMessage,
        );

        if (onNotificationOpened) {
          onNotificationOpened(remoteMessage);
        }
      }
    });

  // Handle background messages (optional - for data-only messages)
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log("📱 Background message:", remoteMessage);
  });

  // Return cleanup function
  return () => {
    unsubscribeForeground();
  };
}

/**
 * Handle token refresh
 */
export function setupTokenRefreshHandler(userId: string, authToken: string) {
  return messaging().onTokenRefresh((newToken) => {
    console.log("🔄 FCM token refreshed:", newToken.substring(0, 20) + "...");

    // Register new token with backend
    registerFCMToken(userId, authToken);
  });
}

/**
 * Get device ID (for tracking multiple devices)
 */
async function getDeviceId(): Promise<string> {
  // You can use expo-device or react-native-device-info
  // For now, return a simple identifier
  return Platform.OS + "-" + Date.now();
}
