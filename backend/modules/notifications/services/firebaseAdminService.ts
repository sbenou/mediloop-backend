/**
 * Firebase Admin Service
 *
 * Initializes Firebase Admin SDK for sending push notifications via FCM.
 * Used by notification workers to deliver notifications to mobile devices.
 */

import {
  initializeApp,
  cert,
  App,
  ServiceAccount,
} from "npm:firebase-admin@12.0.0/app";
import { getMessaging, Messaging } from "npm:firebase-admin@12.0.0/messaging";

let app: App | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebase() {
  if (app) {
    console.log("🔥 Firebase already initialized");
    return { app, messaging: messaging! };
  }

  try {
    // Option 1: Use full service account JSON from env
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

    if (serviceAccountJson) {
      const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);

      app = initializeApp({
        credential: cert(serviceAccount),
      });

      console.log("🔥 Firebase initialized with service account JSON");
    }
    // Option 2: Use individual env vars
    else {
      const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
      const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY");
      const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");

      if (!projectId || !privateKey || !clientEmail) {
        throw new Error(
          "Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT or (FIREBASE_PROJECT_ID + FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL)",
        );
      }

      const serviceAccount: ServiceAccount = {
        projectId,
        privateKey: privateKey.replace(/\\n/g, "\n"), // Fix escaped newlines
        clientEmail,
      };

      app = initializeApp({
        credential: cert(serviceAccount),
      });

      console.log("🔥 Firebase initialized with individual env vars");
    }

    messaging = getMessaging(app);

    console.log(
      `✅ Firebase Admin SDK ready for project: ${app.options.projectId}`,
    );

    return { app, messaging };
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
    throw error;
  }
}

/**
 * Get Firebase Messaging instance
 */
export function getFirebaseMessaging(): Messaging {
  if (!messaging) {
    const initialized = initializeFirebase();
    return initialized.messaging;
  }
  return messaging;
}

/**
 * Send push notification to specific device token
 */
export async function sendToToken(
  token: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: Record<string, string>,
  options?: {
    priority?: "high" | "normal";
    sound?: string;
    badge?: number;
  },
) {
  const fcm = getFirebaseMessaging();

  try {
    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
      },
      ...(data && { data }),
      android: {
        priority:
          options?.priority === "high"
            ? ("high" as const)
            : ("normal" as const),
        notification: {
          sound: options?.sound || "default",
          channelId: "mediloop_notifications",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: options?.sound || "default",
            ...(options?.badge !== undefined && { badge: options.badge }),
          },
        },
      },
    };

    const response = await fcm.send(message);
    console.log("✅ Notification sent successfully:", response);
    return { success: true, messageId: response };
  } catch (error: any) {
    console.error("❌ Error sending notification:", error);

    // Handle invalid/expired tokens
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      console.log(
        `⚠️ Invalid token, should be removed from database: ${token}`,
      );
      return { success: false, error: "invalid_token", shouldRemove: true };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Send push notification to topic (broadcast to multiple users)
 */
export async function sendToTopic(
  topic: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: Record<string, string>,
  options?: {
    priority?: "high" | "normal";
    sound?: string;
    badge?: number;
  },
) {
  const fcm = getFirebaseMessaging();

  try {
    const message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
      },
      ...(data && { data }),
      android: {
        priority:
          options?.priority === "high"
            ? ("high" as const)
            : ("normal" as const),
        notification: {
          sound: options?.sound || "default",
          channelId: "mediloop_notifications",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: options?.sound || "default",
            ...(options?.badge !== undefined && { badge: options.badge }),
          },
        },
      },
    };

    const response = await fcm.send(message);
    console.log(`✅ Topic notification sent to "${topic}":`, response);
    return { success: true, messageId: response };
  } catch (error: any) {
    console.error(`❌ Error sending to topic "${topic}":`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe device token to topic
 */
export async function subscribeToTopic(token: string, topic: string) {
  const fcm = getFirebaseMessaging();

  try {
    await fcm.subscribeToTopic(token, topic);
    console.log(`✅ Subscribed token to topic: ${topic}`);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Error subscribing to topic "${topic}":`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe multiple tokens to topic (batch operation)
 */
export async function subscribeToTopicBatch(tokens: string[], topic: string) {
  const fcm = getFirebaseMessaging();

  try {
    const response = await fcm.subscribeToTopic(tokens, topic);
    console.log(`✅ Subscribed ${tokens.length} tokens to topic: ${topic}`);
    console.log(
      `   Success: ${response.successCount}, Failures: ${response.failureCount}`,
    );
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors: response.errors,
    };
  } catch (error: any) {
    console.error(`❌ Error batch subscribing to topic "${topic}":`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Unsubscribe device token from topic
 */
export async function unsubscribeFromTopic(token: string, topic: string) {
  const fcm = getFirebaseMessaging();

  try {
    await fcm.unsubscribeFromTopic(token, topic);
    console.log(`✅ Unsubscribed token from topic: ${topic}`);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Error unsubscribing from topic "${topic}":`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Unsubscribe multiple tokens from topic (batch operation)
 */
export async function unsubscribeFromTopicBatch(
  tokens: string[],
  topic: string,
) {
  const fcm = getFirebaseMessaging();

  try {
    const response = await fcm.unsubscribeFromTopic(tokens, topic);
    console.log(`✅ Unsubscribed ${tokens.length} tokens from topic: ${topic}`);
    console.log(
      `   Success: ${response.successCount}, Failures: ${response.failureCount}`,
    );
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors: response.errors,
    };
  } catch (error: any) {
    console.error(`❌ Error batch unsubscribing from topic "${topic}":`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notifications to multiple tokens (multicast)
 */
export async function sendToMultipleTokens(
  tokens: string[],
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: Record<string, string>,
  options?: {
    priority?: "high" | "normal";
    sound?: string;
    badge?: number;
  },
) {
  const fcm = getFirebaseMessaging();

  try {
    const message = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
      },
      ...(data && { data }),
      android: {
        priority:
          options?.priority === "high"
            ? ("high" as const)
            : ("normal" as const),
        notification: {
          sound: options?.sound || "default",
          channelId: "mediloop_notifications",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: options?.sound || "default",
            ...(options?.badge !== undefined && { badge: options.badge }),
          },
        },
      },
    };

    const response = await fcm.sendEachForMulticast(message);
    console.log(`✅ Multicast sent to ${tokens.length} tokens`);
    console.log(
      `   Success: ${response.successCount}, Failures: ${response.failureCount}`,
    );

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error: any) {
    console.error("❌ Error sending multicast:", error);
    return { success: false, error: error.message };
  }
}
