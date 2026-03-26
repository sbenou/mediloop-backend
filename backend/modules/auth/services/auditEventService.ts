import { postgresService } from "../../../shared/services/postgresService.ts";

export type AuditOutcome = "success" | "denied" | "error";

/** PostgreSQL INET is strict; only pass plausible literals or null. */
export function clientIpForAudit(ip: string | undefined | null): string | null {
  if (!ip || ip === "unknown") return null;
  const v = ip.trim();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) return v;
  if (/^[0-9a-f:]+$/i.test(v) && v.includes(":")) return v;
  return null;
}

export interface AuditEventParams {
  userId?: string | null;
  sessionId?: string | null;
  tenantId?: string | null;
  membershipId?: string | null;
  role?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  targetPatientId?: string | null;
  targetPatientTenantId?: string | null;
  outcome: AuditOutcome;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Best-effort audit insert. Failures are logged and must not fail the request.
 */
export async function recordAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    await postgresService.query(
      `INSERT INTO public.audit_events (
        user_id, session_id, tenant_id, membership_id, role,
        action, resource_type, resource_id,
        target_patient_id, target_patient_tenant_id,
        outcome, ip_address, user_agent, request_id, metadata
      ) VALUES (
        $1::uuid, $2, $3::uuid, $4::uuid, $5,
        $6, $7, $8,
        $9::uuid, $10::uuid,
        $11, $12::inet, $13, $14, $15::jsonb
      )`,
      [
        params.userId || null,
        params.sessionId || null,
        params.tenantId || null,
        params.membershipId || null,
        params.role || null,
        params.action,
        params.resourceType || null,
        params.resourceId || null,
        params.targetPatientId || null,
        params.targetPatientTenantId || null,
        params.outcome,
        params.ipAddress || null,
        params.userAgent || null,
        params.requestId || null,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ],
    );
  } catch (e) {
    console.warn("[audit_events] recordAuditEvent failed:", e);
  }
}
