/**
 * Superadmin platform routes backed by Neon (public schema).
 * Replaces legacy Supabase PostgREST/RPC for admin UI.
 */
import { Context, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { postgresService } from "../../../shared/services/postgresService.ts";
import {
  clientIpForAudit,
  recordAuditEvent,
} from "../../auth/services/auditEventService.ts";

const router = new Router();

type JwtUser = {
  id?: string;
  role?: string;
  session_id?: string;
  tenant_id?: string;
};

const ASSIGNABLE_ROLES = new Set([
  "patient",
  "user",
  "doctor",
  "pharmacist",
  "superadmin",
]);

function requireSuperadmin(ctx: Context): JwtUser | null {
  const user = ctx.state.user as JwtUser | undefined;
  const role = (user?.role || "").toLowerCase();
  if (!user?.id || role !== "superadmin") {
    ctx.response.status = 403;
    ctx.response.body = {
      error: "Forbidden",
      message: "Only superadmin may access this resource",
    };
    return null;
  }
  return user;
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(id);
}

/** Oak Router param bag (Context typing omits `params` in strict mode). */
function routeParams(ctx: Context): Record<string, string> {
  return (ctx as unknown as { params: Record<string, string> }).params ?? {};
}

/** List platform users (auth.users), shaped like session profile rows. */
router.get("/api/admin/profiles", async (ctx: Context) => {
  const admin = requireSuperadmin(ctx);
  if (!admin) return;

  try {
    const result = await postgresService.query(
      `SELECT
         u.id,
         u.role,
         u.role_id,
         u.full_name,
         u.email,
         NULL::text        AS avatar_url,
         NULL::timestamp   AS date_of_birth,
         NULL::text        AS city,
         NULL::text        AS auth_method,
         (COALESCE(u.status, 'active') = 'blocked') AS is_blocked,
         NULL::text        AS doctor_stamp_url,
         NULL::text        AS doctor_signature_url,
         NULL::text        AS pharmacist_stamp_url,
         NULL::text        AS pharmacist_signature_url,
         NULL::text        AS cns_card_front,
         NULL::text        AS cns_card_back,
         NULL::text        AS cns_number,
         NULL::timestamp   AS deleted_at,
         u.created_at,
         u.updated_at,
         NULL::text        AS license_number,
         NULL::text        AS pharmacy_name,
         NULL::text        AS pharmacy_logo_url
       FROM auth.users u
       WHERE COALESCE(u.status, 'active') <> 'deleted'
       ORDER BY u.created_at DESC NULLS LAST`,
    );

    ctx.response.body = { profiles: result.rows };
  } catch (e) {
    console.error("[admin] list profiles error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to list profiles" };
  }
});

/** List global roles from public.roles. */
router.get("/api/admin/roles", async (ctx: Context) => {
  const admin = requireSuperadmin(ctx);
  if (!admin) return;

  try {
    const result = await postgresService.query(
      `SELECT id, name, description, created_at, updated_at
       FROM public.roles
       ORDER BY created_at ASC NULLS LAST`,
    );
    ctx.response.body = { roles: result.rows };
  } catch (e) {
    console.error("[admin] list roles error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to list roles" };
  }
});

/** Update role in auth.users only (Neon: no public.profiles; tenant profiles live per-schema). */
router.patch("/api/admin/profiles/:id/role", async (ctx: Context) => {
  const admin = requireSuperadmin(ctx);
  if (!admin) return;

  const id = routeParams(ctx).id;
  if (!id || !isUuid(id)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid profile id" };
    return;
  }

  let body: { role?: string };
  try {
    body = (await ctx.request.body({ type: "json" }).value) as {
      role?: string;
    };
  } catch {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid JSON body" };
    return;
  }

  const role = (body.role || "").toLowerCase();
  if (!ASSIGNABLE_ROLES.has(role)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid role" };
    return;
  }

  const ip = clientIpForAudit(
    ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      ctx.request.ip,
  );

  try {
    const prof = await postgresService.query(
      `UPDATE auth.users
       SET role = $1, updated_at = now()
       WHERE id = $2 AND COALESCE(status, 'active') <> 'deleted'
       RETURNING id`,
      [role, id],
    );
    if (prof.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Profile not found" };
      await recordAuditEvent({
        userId: admin.id ?? null,
        sessionId: admin.session_id ?? null,
        tenantId: admin.tenant_id ?? null,
        role: admin.role ?? null,
        action: "admin.profile.role_update",
        resourceType: "profile",
        resourceId: id,
        outcome: "denied",
        ipAddress: ip,
        metadata: { reason: "not_found_or_deleted" },
      });
      return;
    }

    await recordAuditEvent({
      userId: admin.id ?? null,
      sessionId: admin.session_id ?? null,
      tenantId: admin.tenant_id ?? null,
      role: admin.role ?? null,
      action: "admin.profile.role_update",
      resourceType: "profile",
      resourceId: id,
      outcome: "success",
      ipAddress: ip,
      metadata: { new_role: role },
    });

    ctx.response.body = { ok: true, id, role };
  } catch (e) {
    console.error("[admin] role update error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to update role" };
    await recordAuditEvent({
      userId: admin.id ?? null,
      sessionId: admin.session_id ?? null,
      tenantId: admin.tenant_id ?? null,
      role: admin.role ?? null,
      action: "admin.profile.role_update",
      resourceType: "profile",
      resourceId: id,
      outcome: "error",
      ipAddress: ip,
      metadata: { message: String(e) },
    });
  }
});

/** Toggle blocked state via auth.users.status (blocked | active). */
router.post("/api/admin/profiles/:id/toggle-block", async (ctx: Context) => {
  const admin = requireSuperadmin(ctx);
  if (!admin) return;

  const id = routeParams(ctx).id;
  if (!id || !isUuid(id)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid profile id" };
    return;
  }

  const ip = clientIpForAudit(
    ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      ctx.request.ip,
  );

  try {
    const result = await postgresService.query(
      `UPDATE auth.users
       SET status = CASE
             WHEN COALESCE(status, 'active') = 'blocked' THEN 'active'
             ELSE 'blocked'
           END,
           updated_at = now()
       WHERE id = $1 AND COALESCE(status, 'active') <> 'deleted'
       RETURNING id, status`,
      [id],
    );
    if (result.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    const row = result.rows[0] as { id: string; status: string };
    const isBlocked = (row.status || "").toLowerCase() === "blocked";

    await recordAuditEvent({
      userId: admin.id ?? null,
      sessionId: admin.session_id ?? null,
      tenantId: admin.tenant_id ?? null,
      role: admin.role ?? null,
      action: "admin.profile.toggle_block",
      resourceType: "profile",
      resourceId: id,
      outcome: "success",
      ipAddress: ip,
      metadata: { is_blocked: isBlocked },
    });

    ctx.response.body = {
      ok: true,
      id,
      is_blocked: isBlocked,
    };
  } catch (e) {
    console.error("[admin] toggle-block error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to toggle block status" };
  }
});

/** Soft-delete: auth.users.status = 'deleted'. */
router.post("/api/admin/profiles/:id/soft-delete", async (ctx: Context) => {
  const admin = requireSuperadmin(ctx);
  if (!admin) return;

  const id = routeParams(ctx).id;
  if (!id || !isUuid(id)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid profile id" };
    return;
  }

  if (id === admin.id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Cannot delete your own account" };
    return;
  }

  const ip = clientIpForAudit(
    ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      ctx.request.ip,
  );

  try {
    const result = await postgresService.query(
      `UPDATE auth.users
       SET status = 'deleted', updated_at = now()
       WHERE id = $1 AND COALESCE(status, 'active') <> 'deleted'
       RETURNING id`,
      [id],
    );
    if (result.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    await recordAuditEvent({
      userId: admin.id ?? null,
      sessionId: admin.session_id ?? null,
      tenantId: admin.tenant_id ?? null,
      role: admin.role ?? null,
      action: "admin.profile.soft_delete",
      resourceType: "profile",
      resourceId: id,
      outcome: "success",
      ipAddress: ip,
    });

    ctx.response.body = { ok: true, id };
  } catch (e) {
    console.error("[admin] soft-delete error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to delete user" };
  }
});

router.get("/api/admin/bank-holidays", async (ctx: Context) => {
  const admin = requireSuperadmin(ctx);
  if (!admin) return;

  const country = ctx.request.url.searchParams.get("country") || "";
  if (country !== "Luxembourg" && country !== "France") {
    ctx.response.status = 400;
    ctx.response.body = { error: "country must be Luxembourg or France" };
    return;
  }

  try {
    const result = await postgresService.query(
      `SELECT id, country, holiday_name, holiday_date, created_at, updated_at
       FROM public.bank_holidays
       WHERE country::text = $1
       ORDER BY holiday_date ASC`,
      [country],
    );
    ctx.response.body = { holidays: result.rows };
  } catch (e) {
    console.error("[admin] bank-holidays list error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to load bank holidays" };
  }
});

router.post("/api/admin/bank-holidays", async (ctx: Context) => {
  const admin = requireSuperadmin(ctx);
  if (!admin) return;

  let body: {
    country?: string;
    holiday_name?: string;
    holiday_date?: string;
  };
  try {
    body = (await ctx.request.body({ type: "json" }).value) as typeof body;
  } catch {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid JSON body" };
    return;
  }

  const country = body.country || "";
  if (country !== "Luxembourg" && country !== "France") {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid country" };
    return;
  }

  const holiday_name = (body.holiday_name || "").trim();
  const holiday_date = (body.holiday_date || "").trim();
  if (!holiday_name || !holiday_date) {
    ctx.response.status = 400;
    ctx.response.body = { error: "holiday_name and holiday_date required" };
    return;
  }

  try {
    const ins = await postgresService.query(
      `INSERT INTO public.bank_holidays (country, holiday_name, holiday_date)
       VALUES ($1, $2, $3::date)
       RETURNING id, country, holiday_name, holiday_date, created_at, updated_at`,
      [country, holiday_name, holiday_date],
    );
    ctx.response.status = 201;
    ctx.response.body = { holiday: ins.rows[0] };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      ctx.response.status = 409;
      ctx.response.body = {
        error: "A holiday already exists on this date for this country",
      };
      return;
    }
    console.error("[admin] bank-holidays insert error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to add bank holiday" };
  }
});

router.delete("/api/admin/bank-holidays/:id", async (ctx: Context) => {
  const admin = requireSuperadmin(ctx);
  if (!admin) return;

  const id = routeParams(ctx).id;
  if (!id || !isUuid(id)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid id" };
    return;
  }

  try {
    const del = await postgresService.query(
      `DELETE FROM public.bank_holidays WHERE id = $1 RETURNING id`,
      [id],
    );
    if (del.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Not found" };
      return;
    }
    ctx.response.body = { ok: true };
  } catch (e) {
    console.error("[admin] bank-holidays delete error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to delete bank holiday" };
  }
});

export const superadminPlatformRoutes = router;
