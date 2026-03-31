/**
 * Phase 5A — read-only legacy / attribution review for superadmin.
 * GET /api/admin/legacy-clinical
 */
import { Context, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { postgresService } from "../../../shared/services/postgresService.ts";
import { recordAuditEvent, clientIpForAudit } from "../../auth/services/auditEventService.ts";

const router = new Router();

type JwtUser = { id?: string; role?: string; session_id?: string };

const DEFAULT_STATUSES = ["legacy_pending", "quarantined"] as const;

function requireSuperadmin(ctx: Context): JwtUser | null {
  const user = ctx.state.user as JwtUser | undefined;
  const role = (user?.role || "").toLowerCase();
  if (!user?.id || role !== "superadmin") {
    ctx.response.status = 403;
    ctx.response.body = {
      error: "Forbidden",
      message: "Only superadmin may access legacy clinical review",
    };
    return null;
  }
  return user;
}

function parseResource(url: URL): "all" | "prescriptions" | "teleconsultations" | "connections" {
  const r = (url.searchParams.get("resource") || "all").toLowerCase();
  if (r === "prescription" || r === "prescriptions") return "prescriptions";
  if (r === "teleconsultation" || r === "teleconsultations") return "teleconsultations";
  if (r === "connection" || r === "connections" || r === "doctor_patient_connections") {
    return "connections";
  }
  return "all";
}

/** Returns SQL fragment and whether params need status array. */
function parseAttributionFilter(url: URL): { mode: "all" } | { mode: "in"; statuses: string[] } {
  const raw = (url.searchParams.get("attribution_status") ||
    url.searchParams.get("status") ||
    "").toLowerCase();
  if (!raw || raw === "default" || raw === "queue") {
    return { mode: "in", statuses: [...DEFAULT_STATUSES] };
  }
  if (raw === "all") return { mode: "all" };
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const allowed = new Set(["legacy_pending", "quarantined", "attributed"]);
  const statuses = parts.filter((p) => allowed.has(p));
  if (statuses.length === 0) {
    return { mode: "in", statuses: [...DEFAULT_STATUSES] };
  }
  return { mode: "in", statuses };
}

function parseLimitOffset(url: URL): { limit: number; offset: number } {
  let limit = parseInt(url.searchParams.get("limit") || "100", 10);
  let offset = parseInt(url.searchParams.get("offset") || "0", 10);
  if (Number.isNaN(limit) || limit < 1) limit = 100;
  if (limit > 500) limit = 500;
  if (Number.isNaN(offset) || offset < 0) offset = 0;
  return { limit, offset };
}

function forwardedIp(ctx: Context): string | null {
  const xff = ctx.request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  return null;
}

export interface LegacyClinicalRow {
  resource_type: "prescription" | "teleconsultation" | "doctor_patient_connection";
  id: string;
  created_at: string;
  updated_at: string;
  attribution_status: string;
  professional_tenant_id: string | null;
  created_by_membership_id: string | null;
  tenant_display_name: string | null;
  patient: { id: string; display_name: string | null };
  clinician: { id: string; display_name: string | null };
  summary: string | null;
  detail_status: string | null;
}

router.get("/api/admin/legacy-clinical", async (ctx: Context) => {
  const user = requireSuperadmin(ctx);
  if (!user) return;

  const url = ctx.request.url;
  const resource = parseResource(url);
  const attr = parseAttributionFilter(url);
  const { limit, offset } = parseLimitOffset(url);

  const statusWhereP = attr.mode === "all"
    ? "TRUE"
    : "p.attribution_status = ANY($1::public.clinical_attribution_status[])";
  const statusWhereT = attr.mode === "all"
    ? "TRUE"
    : "t.attribution_status = ANY($1::public.clinical_attribution_status[])";
  const statusWhereC = attr.mode === "all"
    ? "TRUE"
    : "c.attribution_status = ANY($1::public.clinical_attribution_status[])";

  const parts: string[] = [];
  const params: unknown[] = [];
  if (attr.mode === "in") {
    params.push(attr.statuses);
  }
  const limitParam = params.length + 1;
  const offsetParam = params.length + 2;
  params.push(limit, offset);

  if (resource === "all" || resource === "prescriptions") {
    parts.push(`
      SELECT
        'prescription'::text AS resource_type,
        p.id,
        p.created_at,
        p.updated_at,
        p.attribution_status::text AS attribution_status,
        p.professional_tenant_id,
        p.created_by_membership_id,
        ten.name AS tenant_display_name,
        p.patient_id AS patient_id,
        pat.full_name AS patient_display_name,
        p.doctor_id AS clinician_id,
        doc.full_name AS clinician_display_name,
        p.medication_name::text AS summary,
        p.status::text AS detail_status
      FROM public.prescriptions p
      INNER JOIN auth.users doc ON doc.id = p.doctor_id
      INNER JOIN auth.users pat ON pat.id = p.patient_id
      LEFT JOIN public.tenants ten ON ten.id = p.professional_tenant_id
      WHERE ${statusWhereP}
    `);
  }

  if (resource === "all" || resource === "teleconsultations") {
    parts.push(`
      SELECT
        'teleconsultation'::text AS resource_type,
        t.id,
        t.created_at,
        t.updated_at,
        t.attribution_status::text AS attribution_status,
        t.professional_tenant_id,
        t.created_by_membership_id,
        ten.name AS tenant_display_name,
        t.patient_id AS patient_id,
        pat.full_name AS patient_display_name,
        t.doctor_id AS clinician_id,
        doc.full_name AS clinician_display_name,
        COALESCE(t.reason, t.status::text) AS summary,
        t.status::text AS detail_status
      FROM public.teleconsultations t
      INNER JOIN auth.users doc ON doc.id = t.doctor_id
      INNER JOIN auth.users pat ON pat.id = t.patient_id
      LEFT JOIN public.tenants ten ON ten.id = t.professional_tenant_id
      WHERE ${statusWhereT}
    `);
  }

  if (resource === "all" || resource === "connections") {
    parts.push(`
      SELECT
        'doctor_patient_connection'::text AS resource_type,
        c.id,
        c.created_at,
        c.updated_at,
        c.attribution_status::text AS attribution_status,
        c.professional_tenant_id,
        c.created_by_membership_id,
        ten.name AS tenant_display_name,
        c.patient_id AS patient_id,
        pat.full_name AS patient_display_name,
        c.doctor_id AS clinician_id,
        doc.full_name AS clinician_display_name,
        c.status::text AS summary,
        NULL::text AS detail_status
      FROM public.doctor_patient_connections c
      INNER JOIN auth.users doc ON doc.id = c.doctor_id
      INNER JOIN auth.users pat ON pat.id = c.patient_id
      LEFT JOIN public.tenants ten ON ten.id = c.professional_tenant_id
      WHERE ${statusWhereC}
    `);
  }

  if (parts.length === 0) {
    ctx.response.status = 400;
    ctx.response.body = { error: "No resource type selected" };
    return;
  }

  const unionSql = parts.join(" UNION ALL ");

  const sql = `
    SELECT * FROM (
      ${unionSql}
    ) AS u
    ORDER BY u.created_at DESC
    LIMIT $${limitParam}::int OFFSET $${offsetParam}::int
  `;

  try {
    const result = await postgresService.query(sql, params);
    const rows: LegacyClinicalRow[] = (result.rows as Record<string, unknown>[]).map((r) => ({
      resource_type: r.resource_type as LegacyClinicalRow["resource_type"],
      id: String(r.id),
      created_at: r.created_at != null ? new Date(r.created_at as string).toISOString() : "",
      updated_at: r.updated_at != null ? new Date(r.updated_at as string).toISOString() : "",
      attribution_status: String(r.attribution_status ?? ""),
      professional_tenant_id: r.professional_tenant_id != null
        ? String(r.professional_tenant_id)
        : null,
      created_by_membership_id: r.created_by_membership_id != null
        ? String(r.created_by_membership_id)
        : null,
      tenant_display_name: (r.tenant_display_name as string | null) ?? null,
      patient: {
        id: String(r.patient_id),
        display_name: (r.patient_display_name as string | null) ?? null,
      },
      clinician: {
        id: String(r.clinician_id),
        display_name: (r.clinician_display_name as string | null) ?? null,
      },
      summary: (r.summary as string | null) ?? null,
      detail_status: (r.detail_status as string | null) ?? null,
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      rows,
      count: rows.length,
      limit,
      offset,
      filters: {
        resource,
        attribution_status:
          attr.mode === "all" ? "all" : attr.statuses,
      },
    };

    const ip = clientIpForAudit(forwardedIp(ctx));
    await recordAuditEvent({
      userId: user.id,
      sessionId: user.session_id ?? null,
      tenantId: null,
      membershipId: null,
      role: "superadmin",
      action: "admin.legacy_clinical.list",
      resourceType: "legacy_clinical_review",
      resourceId: null,
      outcome: "success",
      ipAddress: ip,
      userAgent: ctx.request.headers.get("user-agent"),
      requestId: ctx.request.headers.get("x-request-id"),
      metadata: {
        resource,
        attribution_filter: attr,
        limit,
        offset,
        row_count: rows.length,
      },
    });
  } catch (e) {
    console.error("[admin] legacy-clinical list error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("attribution_status") || msg.includes("clinical_attribution_status")) {
      ctx.response.status = 503;
      ctx.response.body = {
        error: "Schema not ready",
        message:
          "Apply migration_023_option_c_phase4_attribution_status.sql (attribution_status columns).",
      };
      return;
    }
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to load legacy clinical rows" };
  }
});

export const legacyClinicalAdminRoutes = router;
