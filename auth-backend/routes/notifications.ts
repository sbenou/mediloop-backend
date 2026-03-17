/**
 * Notification Routes
 * API endpoints for sending and managing notifications
 */

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import * as notificationService from "../services/notificationService.ts";
import * as topicService from "../services/topicService.ts";
import { db } from "../db/connection.ts";

const router = new Router();

/**
 * Send notification to specific user
 * POST /api/notifications/send
 */
router.post("/api/notifications/send", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { userId, notification, channels } = body;

    if (!userId || !notification) {
      ctx.response.status = 400;
      ctx.response.body = { error: "userId and notification are required" };
      return;
    }

    const result = await notificationService.sendNotification(
      userId,
      notification,
      channels,
    );

    ctx.response.status = 200;
    ctx.response.body = result;
  } catch (error: any) {
    console.error("❌ Error sending notification:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

/**
 * Send notification to topic (broadcast)
 * POST /api/notifications/send-to-topic
 */
router.post("/api/notifications/send-to-topic", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { topic, notification, channels } = body;

    if (!topic || !notification) {
      ctx.response.status = 400;
      ctx.response.body = { error: "topic and notification are required" };
      return;
    }

    const result = await notificationService.sendToTopic(
      topic,
      notification,
      channels,
    );

    ctx.response.status = 200;
    ctx.response.body = result;
  } catch (error: any) {
    console.error("❌ Error sending topic notification:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

/**
 * Send notification to multiple users
 * POST /api/notifications/send-to-multiple
 */
router.post("/api/notifications/send-to-multiple", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { userIds, notification, channels } = body;

    if (!userIds || !Array.isArray(userIds) || !notification) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "userIds (array) and notification are required",
      };
      return;
    }

    const result = await notificationService.sendToMultipleUsers(
      userIds,
      notification,
      channels,
    );

    ctx.response.status = 200;
    ctx.response.body = result;
  } catch (error: any) {
    console.error("❌ Error sending to multiple users:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

/**
 * Schedule notification for later
 * POST /api/notifications/schedule
 */
router.post("/api/notifications/schedule", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { userId, notification, sendAt, channels } = body;

    if (!userId || !notification || !sendAt) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "userId, notification, and sendAt are required",
      };
      return;
    }

    const result = await notificationService.scheduleNotification(
      userId,
      notification,
      new Date(sendAt),
      channels,
    );

    ctx.response.status = 200;
    ctx.response.body = result;
  } catch (error: any) {
    console.error("❌ Error scheduling notification:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

/**
 * Register FCM token for user
 * POST /api/notifications/register-token
 */
router.post("/api/notifications/register-token", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { userId, fcmToken, platform, deviceId } = body;

    if (!userId || !fcmToken) {
      ctx.response.status = 400;
      ctx.response.body = { error: "userId and fcmToken are required" };
      return;
    }

    // Store FCM token in database
    await db.query(
      `INSERT INTO user_push_tokens (user_id, fcm_token, platform, device_id, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       ON CONFLICT (user_id, fcm_token) 
       DO UPDATE SET active = true, updated_at = NOW()`,
      [userId, fcmToken, platform || "unknown", deviceId || null],
    );

    // Auto-subscribe to relevant topics
    const topicResult = await topicService.autoSubscribeUserToTopics(
      userId,
      fcmToken,
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "FCM token registered",
      topics: topicResult.topics || [],
    };
  } catch (error: any) {
    console.error("❌ Error registering FCM token:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

/**
 * Unregister FCM token (when user logs out)
 * POST /api/notifications/unregister-token
 */
router.post("/api/notifications/unregister-token", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { userId, fcmToken } = body;

    if (!userId || !fcmToken) {
      ctx.response.status = 400;
      ctx.response.body = { error: "userId and fcmToken are required" };
      return;
    }

    // Mark token as inactive
    await db.query(
      `UPDATE user_push_tokens 
       SET active = false, updated_at = NOW() 
       WHERE user_id = $1 AND fcm_token = $2`,
      [userId, fcmToken],
    );

    // Unsubscribe from all topics
    await topicService.unsubscribeFromAllTopics(userId, fcmToken);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "FCM token unregistered",
    };
  } catch (error: any) {
    console.error("❌ Error unregistering FCM token:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

/**
 * Subscribe to topic
 * POST /api/notifications/subscribe-to-topic
 */
router.post("/api/notifications/subscribe-to-topic", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { userId, topic } = body;

    if (!userId || !topic) {
      ctx.response.status = 400;
      ctx.response.body = { error: "userId and topic are required" };
      return;
    }

    // Get user's FCM token
    const tokenResult = await db.query(
      `SELECT fcm_token FROM user_push_tokens 
       WHERE user_id = $1 AND active = true 
       ORDER BY updated_at DESC LIMIT 1`,
      [userId],
    );

    if (!tokenResult.rows[0]) {
      ctx.response.status = 404;
      ctx.response.body = { error: "No active FCM token found for user" };
      return;
    }

    const fcmToken = tokenResult.rows[0].fcm_token;

    // Subscribe to condition topic (for patients)
    const result = await topicService.subscribeToConditionTopic(
      userId,
      fcmToken,
      topic,
    );

    ctx.response.status = 200;
    ctx.response.body = result;
  } catch (error: any) {
    console.error("❌ Error subscribing to topic:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

/**
 * Unsubscribe from topic
 * POST /api/notifications/unsubscribe-from-topic
 */
router.post("/api/notifications/unsubscribe-from-topic", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { userId, topic } = body;

    if (!userId || !topic) {
      ctx.response.status = 400;
      ctx.response.body = { error: "userId and topic are required" };
      return;
    }

    // Get user's FCM token
    const tokenResult = await db.query(
      `SELECT fcm_token FROM user_push_tokens 
       WHERE user_id = $1 AND active = true 
       ORDER BY updated_at DESC LIMIT 1`,
      [userId],
    );

    if (!tokenResult.rows[0]) {
      ctx.response.status = 404;
      ctx.response.body = { error: "No active FCM token found for user" };
      return;
    }

    const fcmToken = tokenResult.rows[0].fcm_token;

    // Unsubscribe from condition topic
    const result = await topicService.unsubscribeFromConditionTopic(
      userId,
      fcmToken,
      topic,
    );

    ctx.response.status = 200;
    ctx.response.body = result;
  } catch (error: any) {
    console.error("❌ Error unsubscribing from topic:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

/**
 * Update online status (subscribe/unsubscribe to online topics)
 * POST /api/notifications/update-online-status
 */
router.post("/api/notifications/update-online-status", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { userId, isOnline } = body;

    if (!userId || isOnline === undefined) {
      ctx.response.status = 400;
      ctx.response.body = { error: "userId and isOnline are required" };
      return;
    }

    // Get user's FCM token
    const tokenResult = await db.query(
      `SELECT fcm_token FROM user_push_tokens 
       WHERE user_id = $1 AND active = true 
       ORDER BY updated_at DESC LIMIT 1`,
      [userId],
    );

    if (!tokenResult.rows[0]) {
      ctx.response.status = 404;
      ctx.response.body = { error: "No active FCM token found for user" };
      return;
    }

    const fcmToken = tokenResult.rows[0].fcm_token;

    let result;
    if (isOnline) {
      result = await topicService.subscribeToOnlineTopic(userId, fcmToken);
    } else {
      result = await topicService.unsubscribeFromOnlineTopic(userId, fcmToken);
    }

    ctx.response.status = 200;
    ctx.response.body = result;
  } catch (error: any) {
    console.error("❌ Error updating online status:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

/**
 * Get notification history for user
 * GET /api/notifications/history?userId=xxx&limit=20
 */
router.get("/api/notifications/history", async (ctx) => {
  try {
    const userId = ctx.request.url.searchParams.get("userId");
    const limit = parseInt(ctx.request.url.searchParams.get("limit") || "20");

    if (!userId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "userId parameter is required" };
      return;
    }

    const result = await db.query(
      `SELECT id, title, body, data, image_url, channels, priority, 
              sent_at, read_at, clicked_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY sent_at DESC
       LIMIT $2`,
      [userId, limit],
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      notifications: result.rows,
      count: result.rows.length,
    };
  } catch (error: any) {
    console.error("❌ Error fetching notification history:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

/**
 * Mark notification as read
 * POST /api/notifications/mark-read
 */
router.post("/api/notifications/mark-read", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { notificationId } = body;

    if (!notificationId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "notificationId is required" };
      return;
    }

    await db.query(
      `UPDATE notifications 
       SET read_at = NOW() 
       WHERE id = $1 AND read_at IS NULL`,
      [notificationId],
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Notification marked as read",
    };
  } catch (error: any) {
    console.error("❌ Error marking notification as read:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

/**
 * Get user's subscribed topics
 * GET /api/notifications/topics?userId=xxx
 */
router.get("/api/notifications/topics", async (ctx) => {
  try {
    const userId = ctx.request.url.searchParams.get("userId");

    if (!userId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "userId parameter is required" };
      return;
    }

    const result = await topicService.getUserTopics(userId);

    ctx.response.status = 200;
    ctx.response.body = result;
  } catch (error: any) {
    console.error("❌ Error fetching user topics:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

export default router;
