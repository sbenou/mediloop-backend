import { Context, Next } from "oak";
import { postgresService } from "../../../shared/services/postgresService.ts";
import type { ResolvedActiveContext } from "../types/activeContext.ts";
import {
  clientIpForAudit,
  recordAuditEvent,
} from "../services/auditEventService.ts";

export const HEADER_TENANT_ID = "x-mediloop-tenant-id";
export const HEADER_MEMBERSHIP_ID = "x-mediloop-membership-id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

function getRequestId(ctx: Context): string {
  return (
    ctx.request.headers.get("x-request-id")?.trim() ||
    crypto.randomUUID()
  );
}

function clientMeta(ctx: Context): { ip: string; userAgent: string } {
  const forwarded = ctx.request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() || ctx.request.ip || "unknown";
  const userAgent = ctx.request.headers.get("user-agent") || "";
  return { ip, userAgent };
}

type UserTenantsRow = {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  status: string;
  is_active: boolean;
};

async function loadMembershipForUser(
  membershipId: string,
  userId: string,
): Promise<UserTenantsRow | null> {
  const r = await postgresService.query(
    `SELECT id, user_id, tenant_id, role, status, is_active
     FROM public.user_tenants
     WHERE id = $1::uuid AND user_id = $2::uuid
     LIMIT 1`,
    [membershipId, userId],
  );
  if (!r.rows.length) return null;
  return r.rows[0] as UserTenantsRow;
}

async function loadLegacyMembership(
  userId: string,
  tenantId: string,
): Promise<UserTenantsRow | null> {
  const r = await postgresService.query(
    `SELECT id, user_id, tenant_id, role, status, is_active
     FROM public.user_tenants
     WHERE user_id = $1::uuid AND tenant_id = $2::uuid
     ORDER BY is_primary DESC NULLS LAST, created_at ASC
     LIMIT 1`,
    [userId, tenantId],
  );
  if (!r.rows.length) return null;
  return r.rows[0] as UserTenantsRow;
}

function membershipIsEffectiveActive(row: UserTenantsRow): boolean {
  if (row.is_active === false) return false;
  const st = (row.status || "").toLowerCase();
  return st === "active";
}

/**
 * Option C Phase 2: resolve acting tenant + membership per request.
 *
 * - If **both** `X-Mediloop-Tenant-Id` and `X-Mediloop-Membership-Id` are set:
 *   validate membership belongs to the authenticated user, is active, and matches tenant header.
 * - If **neither** is set: legacy behavior — use JWT `tenant_id` and resolve a membership row when possible.
 * - If only one header is set: 400 (avoid ambiguous partial context).
 *
 * Sets `ctx.state.activeContext` and syncs `ctx.state.user.tenant_id` to the resolved tenant.
 */
export async function activeContextMiddleware(ctx: Context, next: Next) {
  const user = ctx.state.user as
    | {
        id: string;
        tenant_id?: string;
        session_id?: string;
        role?: string;
      }
    | undefined;

  if (!user?.id) {
    await next();
    return;
  }

  const requestId = getRequestId(ctx);
  const { ip, userAgent } = clientMeta(ctx);

  const rawTenant = ctx.request.headers.get(HEADER_TENANT_ID)?.trim();
  const rawMembership = ctx.request.headers.get(HEADER_MEMBERSHIP_ID)?.trim();

  const hasTenant = Boolean(rawTenant);
  const hasMembership = Boolean(rawMembership);

  if (hasTenant !== hasMembership) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: "Invalid workspace context",
      detail:
        "Send both X-Mediloop-Tenant-Id and X-Mediloop-Membership-Id, or omit both for default context.",
    };
    return;
  }

  if (hasTenant && rawTenant && rawMembership) {
    if (!isUuid(rawTenant) || !isUuid(rawMembership)) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Invalid workspace context",
        detail: "Tenant and membership identifiers must be UUIDs.",
      };
      return;
    }

    const row = await loadMembershipForUser(rawMembership, user.id);
    if (!row || row.tenant_id !== rawTenant) {
      await recordAuditEvent({
        userId: user.id,
        sessionId: user.session_id ?? null,
        tenantId: rawTenant,
        membershipId: rawMembership,
        role: user.role ?? null,
        action: "active_context.denied",
        resourceType: "user_tenants",
        resourceId: rawMembership,
        outcome: "denied",
        ipAddress: clientIpForAudit(ip),
        userAgent,
        requestId,
        metadata: { reason: "membership_not_found_or_tenant_mismatch" },
      });
      ctx.response.status = 403;
      ctx.response.body = {
        error: "Forbidden",
        detail: "Membership is invalid for this user or tenant.",
      };
      return;
    }

    if (!membershipIsEffectiveActive(row)) {
      await recordAuditEvent({
        userId: user.id,
        sessionId: user.session_id ?? null,
        tenantId: row.tenant_id,
        membershipId: row.id,
        role: user.role ?? null,
        action: "active_context.denied",
        resourceType: "user_tenants",
        resourceId: row.id,
        outcome: "denied",
        ipAddress: clientIpForAudit(ip),
        userAgent,
        requestId,
        metadata: { reason: "membership_not_active", status: row.status },
      });
      ctx.response.status = 403;
      ctx.response.body = {
        error: "Forbidden",
        detail: "Membership is not active.",
      };
      return;
    }

    const resolved: ResolvedActiveContext = {
      tenantId: row.tenant_id,
      membershipId: row.id,
      tenantRole: row.role,
      source: "request_headers",
    };
    ctx.state.activeContext = resolved;
    ctx.state.user = { ...user, tenant_id: row.tenant_id };
    await next();
    return;
  }

  const jwtTenant = user.tenant_id?.trim();
  if (!jwtTenant || !isUuid(jwtTenant)) {
    await recordAuditEvent({
      userId: user.id,
      sessionId: user.session_id ?? null,
      action: "active_context.denied",
      outcome: "denied",
      ipAddress: clientIpForAudit(ip),
      userAgent,
      requestId,
      metadata: { reason: "legacy_missing_jwt_tenant" },
    });
    ctx.response.status = 403;
    ctx.response.body = {
      error: "Forbidden",
      detail: "No default tenant on session; specify workspace headers.",
    };
    return;
  }

  const legacyRow = await loadLegacyMembership(user.id, jwtTenant);
  if (!legacyRow || !membershipIsEffectiveActive(legacyRow)) {
    await recordAuditEvent({
      userId: user.id,
      sessionId: user.session_id ?? null,
      tenantId: jwtTenant,
      action: "active_context.denied",
      outcome: "denied",
      ipAddress: clientIpForAudit(ip),
      userAgent,
      requestId,
      metadata: {
        reason: legacyRow
          ? "legacy_membership_inactive"
          : "legacy_membership_missing",
      },
    });
    ctx.response.status = 403;
    ctx.response.body = {
      error: "Forbidden",
      detail: "No active membership for default tenant.",
    };
    return;
  }

  ctx.state.activeContext = {
    tenantId: legacyRow.tenant_id,
    membershipId: legacyRow.id,
    tenantRole: legacyRow.role,
    source: "legacy_jwt_membership",
  };
  ctx.state.user = { ...user, tenant_id: legacyRow.tenant_id };
  await next();
}
