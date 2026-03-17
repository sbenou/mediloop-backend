/**
 * Firebase Cloud Messaging Handler
 * Delivers notifications to mobile devices via FCM
 */

import admin from "firebase-admin";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;

  try {
    // Option 1: Full service account JSON from env
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log("🔥 Firebase initialized with service account JSON");
    }
    // Option 2: Individual env vars
    else {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (!projectId || !privateKey || !clientEmail) {
        throw new Error("Missing Firebase credentials");
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, "\n"),
          clientEmail,
        }),
      });

      console.log("🔥 Firebase initialized with individual env vars");
    }

    firebaseInitialized = true;
    console.log(
      `✅ Firebase Admin SDK ready for project: ${admin.app().options.projectId}`,
    );
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
    throw error;
  }
}

// Initialize Firebase on module load
initializeFirebase();

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Get FCM tokens for user
 */
async function getUserTokens(userId) {
  const result = await pool.query(
    `SELECT fcm_token FROM user_push_tokens 
     WHERE user_id = $1 AND active = true`,
    [userId],
  );

  return result.rows.map((row) => row.fcm_token);
}

/**
 * Remove invalid FCM token from database
 */
async function removeInvalidToken(token) {
  await pool.query(
    `UPDATE user_push_tokens 
     SET active = false, updated_at = NOW() 
     WHERE fcm_token = $1`,
    [token],
  );

  console.log(`🗑️ Removed invalid FCM token: ${token.substring(0, 20)}...`);
}

/**
 * Send notification via Firebase Cloud Messaging
 */
export async function sendViaFCM({ userId, userIds, topic, notification }) {
  try {
    // Build FCM message
    const fcmMessage = {
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
      },
      data: notification.data
        ? Object.fromEntries(
            Object.entries(notification.data).map(([k, v]) => [k, String(v)]),
          )
        : undefined,
      android: {
        priority: notification.priority === "high" ? "high" : "normal",
        notification: {
          sound: notification.sound || "default",
          channelId: "mediloop_notifications",
          ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
        },
      },
      apns: {
        payload: {
          aps: {
            sound: notification.sound || "default",
            ...(notification.badge !== undefined && {
              badge: notification.badge,
            }),
            alert: {
              title: notification.title,
              body: notification.body,
            },
          },
        },
        fcmOptions: {
          ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
        },
      },
    };

    // Send to topic
    if (topic) {
      const message = {
        ...fcmMessage,
        topic,
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ FCM notification sent to topic "${topic}": ${response}`);

      return { success: true, messageId: response };
    }

    // Send to multiple users
    if (userIds) {
      const allTokens = [];

      for (const uid of userIds) {
        const tokens = await getUserTokens(uid);
        allTokens.push(...tokens);
      }

      if (allTokens.length === 0) {
        console.log(`⚠️ No FCM tokens found for users: ${userIds.join(", ")}`);
        return { success: false, reason: "no_tokens" };
      }

      const message = {
        ...fcmMessage,
        tokens: allTokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      console.log(
        `✅ FCM multicast sent: ${response.successCount} success, ${response.failureCount} failed`,
      );

      // Remove invalid tokens
      if (response.failureCount > 0) {
        for (let i = 0; i < response.responses.length; i++) {
          const resp = response.responses[i];
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === "messaging/invalid-registration-token" ||
              errorCode === "messaging/registration-token-not-registered"
            ) {
              await removeInvalidToken(allTokens[i]);
            }
          }
        }
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    }

    // Send to single user
    if (userId) {
      const tokens = await getUserTokens(userId);

      if (tokens.length === 0) {
        console.log(`⚠️ No FCM tokens found for user: ${userId}`);
        return { success: false, reason: "no_tokens" };
      }

      // Send to all user's devices
      const message = {
        ...fcmMessage,
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      console.log(
        `✅ FCM sent to user ${userId}: ${response.successCount} success, ${response.failureCount} failed`,
      );

      // Remove invalid tokens
      if (response.failureCount > 0) {
        for (let i = 0; i < response.responses.length; i++) {
          const resp = response.responses[i];
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === "messaging/invalid-registration-token" ||
              errorCode === "messaging/registration-token-not-registered"
            ) {
              await removeInvalidToken(tokens[i]);
            }
          }
        }
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    }

    throw new Error("Either userId, userIds, or topic must be provided");
  } catch (error) {
    console.error("❌ Error sending FCM notification:", error);
    throw error;
  }
}
