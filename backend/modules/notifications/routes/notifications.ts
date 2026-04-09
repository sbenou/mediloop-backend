/**
 * Notification Routes
 * API endpoints for sending and managing notifications
 */

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import type { ResolvedActiveContext } from "../../auth/types/activeContext.ts";
import * as notificationService from "../services/notificationService.ts";
import * as topicService from "../services/topicService.ts";
import { postgresService } from "../../../shared/services/postgresService.ts";

const router = new Router();

type JwtUser = { id?: string; role?: string };

function stateUser(ctx: { state: Record<string, unknown> }): JwtUser | undefined {
  return ctx.state.user as JwtUser | undefined;
}

function getActiveContext(
  ctx: { state: Record<string, unknown> },
): ResolvedActiveContext | undefined {
  return ctx.state.activeContext as ResolvedActiveContext | undefined;
}

async function personalHealthTenantIdForUser(
  userId: string,
): Promise<string | null> {
  const r = await postgresService.query(
    `SELECT tenant_id::text AS tenant_id
     FROM public.personal_health_tenants
     WHERE user_id = $1::uuid
     LIMIT 1`,
    [userId],
  );
  const row = r.rows[0] as { tenant_id?: string } | undefined;
  return row?.tenant_id ?? null;
}

/** Resolve inbox kind: explicit query vs auto (PH tenant vs workplace tenant). */
function resolveNotificationInbox(
  rawInbox: string | null,
  phTenantId: string | null,
  activeTenantId: string,
): "personal_health" | "tenant" | "professional_personal" {
  const v = (rawInbox || "").trim().toLowerCase();
  if (v === "professional_personal") return "professional_personal";
  if (v === "personal_health") return "personal_health";
  if (v === "tenant") return "tenant";
  if (phTenantId && activeTenantId === phTenantId) return "personal_health";
  return "tenant";
}

type NotificationScopeRow = {
  scope_type: string;
  scope_tenant_id: string | null;
  scope_membership_id: string | null;
  read_at: unknown;
};

/** Same visibility rules as GET /history for the resolved inbox. */
function notificationRowMatchesResolvedInbox(
  row: NotificationScopeRow,
  inbox: "personal_health" | "tenant" | "professional_personal",
  ac: ResolvedActiveContext | undefined,
  phTenantId: string | null,
): boolean {
  if (inbox === "professional_personal") {
    return row.scope_type === "professional_personal";
  }
  if (!ac?.tenantId || !ac?.membershipId) return false;
  if (inbox === "personal_health") {
    if (!phTenantId || ac.tenantId !== phTenantId) return false;
    const st = row.scope_tenant_id != null ? String(row.scope_tenant_id) : "";
    return row.scope_type === "personal_health" && st === phTenantId;
  }
  const stid = row.scope_tenant_id != null ? String(row.scope_tenant_id) : "";
  const smid = row.scope_membership_id != null
    ? String(row.scope_membership_id)
    : "";
  if (row.scope_type !== "tenant" || stid !== ac.tenantId) return false;
  if (row.scope_membership_id == null) return true;
  return smid === ac.membershipId;
}

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

    // Store FCM token in database using postgresService
    await postgresService.query(
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

    // Mark token as inactive using postgresService
    await postgresService.query(
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

    // Get user's FCM token using postgresService
    const tokenResult = await postgresService.query(
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

    const fcmToken = tokenResult.rows[0].fcm_token as string;

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

    // Get user's FCM token using postgresService
    const tokenResult = await postgresService.query(
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

    const fcmToken = tokenResult.rows[0].fcm_token as string;

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

    // Get user's FCM token using postgresService
    const tokenResult = await postgresService.query(
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

    const fcmToken = tokenResult.rows[0].fcm_token as string;

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
 * Get notification history — Option C scoped inbox (JWT user + active workspace).
 *
 * GET /api/notifications/history?limit=20&inbox=tenant|personal_health|professional_personal
 *
 * - Identity: always the authenticated user (`ctx.state.user.id`). Query `userId` is ignored
 *   unless it matches JWT (legacy callers may omit it).
 * - Scope: rows must match `inbox` (default: auto — personal health tenant vs workplace tenant).
 * - Requires `activeContextMiddleware` to have set `ctx.state.activeContext` (except
 *   `inbox=professional_personal`, which only needs auth).
 */
router.get("/api/notifications/history", async (ctx) => {
  try {
    const user = stateUser(ctx);
    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const qpUserId = ctx.request.url.searchParams.get("userId")?.trim();
    if (qpUserId && qpUserId !== user.id) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Cannot read another user's notifications" };
      return;
    }

    const rawLimit = parseInt(ctx.request.url.searchParams.get("limit") || "20", 10);
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 20, 1), 100);

    const ac = getActiveContext(ctx);
    const rawInbox = ctx.request.url.searchParams.get("inbox");
    const phTenantId = await personalHealthTenantIdForUser(user.id);

    const inbox = resolveNotificationInbox(
      rawInbox,
      phTenantId,
      ac?.tenantId || "",
    );

    if (inbox === "professional_personal") {
      const result = await postgresService.query(
        `SELECT id, user_id, tenant_id, title, body, body_preview, data, image_url, channels, priority,
                sent_at, read_at, clicked_at, created_at, updated_at,
                scope_type, scope_tenant_id, scope_membership_id, workspace_kind,
                category, event_type, contains_sensitive_health_data, status,
                archived_at, expires_at, created_by_user_id, source_resource_type,
                source_resource_id, dedupe_key, topic, actions
         FROM public.notifications
         WHERE user_id = $1::uuid
           AND scope_type = 'professional_personal'
           AND (archived_at IS NULL)
           AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY COALESCE(sent_at, created_at) DESC
         LIMIT $2`,
        [user.id, limit],
      );
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        inbox: "professional_personal",
        notifications: result.rows,
        count: result.rows.length,
      };
      return;
    }

    if (!ac?.tenantId || !ac.membershipId) {
      ctx.response.status = 403;
      ctx.response.body = {
        error: "No active workspace context",
        detail:
          "Send X-Mediloop-Tenant-Id and X-Mediloop-Membership-Id for tenant or personal-health inbox.",
      };
      return;
    }

    if (inbox === "personal_health") {
      if (!phTenantId || ac.tenantId !== phTenantId) {
        ctx.response.status = 403;
        ctx.response.body = {
          error: "Forbidden",
          detail:
            "Personal health notifications require active context to be your personal-health tenant.",
        };
        return;
      }
      const result = await postgresService.query(
        `SELECT id, user_id, tenant_id, title, body, body_preview, data, image_url, channels, priority,
                sent_at, read_at, clicked_at, created_at, updated_at,
                scope_type, scope_tenant_id, scope_membership_id, workspace_kind,
                category, event_type, contains_sensitive_health_data, status,
                archived_at, expires_at, created_by_user_id, source_resource_type,
                source_resource_id, dedupe_key, topic, actions
         FROM public.notifications
         WHERE user_id = $1::uuid
           AND scope_type = 'personal_health'
           AND scope_tenant_id = $2::uuid
           AND (archived_at IS NULL)
           AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY COALESCE(sent_at, created_at) DESC
         LIMIT $3`,
        [user.id, ac.tenantId, limit],
      );
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        inbox: "personal_health",
        notifications: result.rows,
        count: result.rows.length,
      };
      return;
    }

    const result = await postgresService.query(
      `SELECT id, user_id, tenant_id, title, body, body_preview, data, image_url, channels, priority,
              sent_at, read_at, clicked_at, created_at, updated_at,
              scope_type, scope_tenant_id, scope_membership_id, workspace_kind,
              category, event_type, contains_sensitive_health_data, status,
              archived_at, expires_at, created_by_user_id, source_resource_type,
              source_resource_id, dedupe_key, topic, actions
       FROM public.notifications
       WHERE user_id = $1::uuid
         AND scope_type = 'tenant'
         AND scope_tenant_id = $2::uuid
         AND (scope_membership_id IS NULL OR scope_membership_id = $4::uuid)
         AND (archived_at IS NULL)
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY COALESCE(sent_at, created_at) DESC
       LIMIT $3`,
      [user.id, ac.tenantId, limit, ac.membershipId],
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      inbox: "tenant",
      notifications: result.rows,
      count: result.rows.length,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ Error fetching notification history:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: msg };
  }
});

/**
 * Mark notification as read (scoped to active workspace unless inbox=professional_personal).
 *
 * POST /api/notifications/mark-read
 * Body: { notificationId, inbox?: "tenant" | "personal_health" | "professional_personal" }
 *
 * Resolves `inbox` like GET /history (omitted = auto from PH tenant vs active tenant).
 * Rejects when the row is not visible in that inbox for the current context.
 */
router.post("/api/notifications/mark-read", async (ctx) => {
  try {
    const user = stateUser(ctx);
    if (!user?.id) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const body = await ctx.request.body({ type: "json" }).value;
    const { notificationId, inbox: rawInboxBody } = body as {
      notificationId?: string;
      inbox?: string;
    };

    if (!notificationId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "notificationId is required" };
      return;
    }

    const sel = await postgresService.query(
      `SELECT scope_type, scope_tenant_id, scope_membership_id, read_at
       FROM public.notifications
       WHERE id = $1::uuid AND user_id = $2::uuid`,
      [notificationId, user.id],
    );
    const row = sel.rows[0] as NotificationScopeRow | undefined;
    if (!row) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Notification not found" };
      return;
    }

    if (row.read_at != null) {
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Notification already read",
        alreadyRead: true,
      };
      return;
    }

    const ac = getActiveContext(ctx);
    const phTenantId = await personalHealthTenantIdForUser(user.id);
    const rawInbox =
      typeof rawInboxBody === "string" && rawInboxBody.trim()
        ? rawInboxBody.trim()
        : null;
    const inbox = resolveNotificationInbox(
      rawInbox,
      phTenantId,
      ac?.tenantId || "",
    );

    if (inbox !== "professional_personal") {
      if (!ac?.tenantId || !ac?.membershipId) {
        ctx.response.status = 403;
        ctx.response.body = {
          error: "No active workspace context",
          detail:
            "Send X-Mediloop-Tenant-Id and X-Mediloop-Membership-Id, or mark professional_personal items with inbox=professional_personal.",
        };
        return;
      }
    }

    if (!notificationRowMatchesResolvedInbox(row, inbox, ac, phTenantId)) {
      ctx.response.status = 403;
      ctx.response.body = {
        error: "Forbidden",
        detail:
          "Notification is not visible in this workspace; switch workspace or pass the matching inbox.",
      };
      return;
    }

    await postgresService.query(
      `UPDATE public.notifications
       SET read_at = NOW(),
           status = 'read',
           updated_at = NOW()
       WHERE id = $1::uuid AND user_id = $2::uuid AND read_at IS NULL`,
      [notificationId, user.id],
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Notification marked as read",
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ Error marking notification as read:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: msg };
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
