/**
 * Notification History Handler
 * Saves notifications to database for history/archive (Option C scoped columns when present).
 */

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const DATABASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL_PROD
    : process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

function previewBody(body) {
  if (!body || typeof body !== "string") return null;
  return body.length > 280 ? body.slice(0, 280) : body;
}

/**
 * Resolve scope_type / scope_tenant_id / scope_membership_id for public.notifications (027+).
 * @param {string|null} userId
 * @param {object|undefined} explicit - from notification.dbScope: { scopeType, scopeTenantId?, scopeMembershipId?, eventType? }
 */
async function resolveDbScope(userId, explicit) {
  const ex = explicit && typeof explicit === "object" ? explicit : {};

  if (ex.scopeType === "professional_personal") {
    return {
      scope_type: "professional_personal",
      scope_tenant_id: ex.scopeTenantId || null,
      scope_membership_id: ex.scopeMembershipId || null,
      event_type: ex.eventType || null,
    };
  }

  if (ex.scopeType === "tenant" && ex.scopeTenantId) {
    return {
      scope_type: "tenant",
      scope_tenant_id: ex.scopeTenantId,
      scope_membership_id: ex.scopeMembershipId || null,
      event_type: ex.eventType || null,
    };
  }

  if (ex.scopeType === "personal_health" && userId) {
    let tid = ex.scopeTenantId || null;
    let mid = ex.scopeMembershipId || null;
    if (!tid) {
      const ph = await pool.query(
        `SELECT tenant_id::text AS tenant_id FROM public.personal_health_tenants WHERE user_id = $1::uuid LIMIT 1`,
        [userId],
      );
      tid = ph.rows[0]?.tenant_id || null;
    }
    if (tid && !mid) {
      const m = await pool.query(
        `SELECT id::text AS id FROM public.user_tenants WHERE user_id = $1::uuid AND tenant_id = $2::uuid LIMIT 1`,
        [userId, tid],
      );
      mid = m.rows[0]?.id || null;
    }
    if (tid) {
      return {
        scope_type: "personal_health",
        scope_tenant_id: tid,
        scope_membership_id: mid,
        event_type: ex.eventType || null,
      };
    }
  }

  if (!userId) {
    return {
      scope_type: "professional_personal",
      scope_tenant_id: null,
      scope_membership_id: null,
      event_type: ex.eventType || null,
    };
  }

  const r = await pool.query(
    `SELECT ut.tenant_id::text AS tenant_id, ut.id::text AS membership_id,
            COALESCE(t.tenant_type, '') AS tenant_type
     FROM public.user_tenants ut
     INNER JOIN public.tenants t ON t.id = ut.tenant_id
     WHERE ut.user_id = $1::uuid AND ut.is_primary = true
       AND ut.is_active IS NOT FALSE
       AND (ut.status IS NULL OR LOWER(ut.status) = 'active')
     LIMIT 1`,
    [userId],
  );

  const row = r.rows[0];
  if (!row) {
    return {
      scope_type: "professional_personal",
      scope_tenant_id: null,
      scope_membership_id: null,
      event_type: ex.eventType || null,
    };
  }

  if (row.tenant_type === "personal_health") {
    return {
      scope_type: "personal_health",
      scope_tenant_id: row.tenant_id,
      scope_membership_id: row.membership_id,
      event_type: ex.eventType || null,
    };
  }

  return {
    scope_type: "tenant",
    scope_tenant_id: row.tenant_id,
    scope_membership_id: row.membership_id,
    event_type: ex.eventType || null,
  };
}

/**
 * Save notification to database
 */
export async function saveToDatabase({ userId, notification, topic }) {
  try {
    const dbScope = await resolveDbScope(userId, notification?.dbScope);
    const tenantLegacy =
      dbScope.scope_tenant_id != null ? String(dbScope.scope_tenant_id) : null;
    const bodyPreview = previewBody(notification?.body);

    const result = await pool.query(
      `INSERT INTO public.notifications
       (user_id, tenant_id, title, body, body_preview, data, image_url, channels, topic, priority, actions, sent_at,
        scope_type, scope_tenant_id, scope_membership_id, workspace_kind, status, contains_sensitive_health_data, event_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(),
        $12, $13::uuid, $14::uuid, $12, 'unread', false, $15)
       RETURNING id`,
      [
        userId || null,
        tenantLegacy,
        notification.title,
        notification.body,
        bodyPreview,
        notification.data ? JSON.stringify(notification.data) : null,
        notification.imageUrl || null,
        ["fcm", "websocket", "database"],
        topic || null,
        notification.priority || "default",
        notification.actions ? JSON.stringify(notification.actions) : null,
        dbScope.scope_type,
        dbScope.scope_tenant_id,
        dbScope.scope_membership_id,
        dbScope.event_type,
      ],
    );

    const notificationId = result.rows[0].id;

    console.log(`✅ Notification saved to database: ${notificationId}`);

    return { success: true, notificationId };
  } catch (error) {
    console.error(`❌ Error saving notification to database:`, error);

    return { success: false, error: error.message };
  }
}
