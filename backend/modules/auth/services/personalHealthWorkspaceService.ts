/**
 * Ensures every user has exactly one personal-health workspace (Option C):
 * - Patients: primary tenant is tagged tenant_type = personal_health + personal_health_tenants row.
 * - Doctors / pharmacists / owners: a dedicated PH tenant + membership + personal_health_tenants
 *   (separate from clinic/pharmacy primary).
 */

import { postgresService } from "../../../shared/services/postgresService.ts";

const PRO_ROLES = new Set([
  "doctor",
  "cabinet_owner",
  "pharmacist",
  "pharmacy_owner",
]);

export function isProfessionalRole(role: string): boolean {
  return PRO_ROLES.has(role);
}

async function linkPrimaryTenantAsPersonalHealth(
  userId: string,
  tenantId: string,
): Promise<void> {
  await postgresService.query(
    `UPDATE public.tenants
     SET tenant_type = 'personal_health', updated_at = NOW()
     WHERE id = $1::uuid`,
    [tenantId],
  );
  await postgresService.query(
    `INSERT INTO public.personal_health_tenants (user_id, tenant_id)
     VALUES ($1::uuid, $2::uuid)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, tenantId],
  );
}

async function createDedicatedPersonalHealthTenant(
  userId: string,
  fullName: string,
): Promise<void> {
  const tenantId = crypto.randomUUID();
  const schemaName = `tenant_${tenantId.replace(/-/g, "_")}`;
  const displayName = `${fullName.trim() || "User"}'s Personal health`;
  const domain = `${userId}_personal_health`;

  await postgresService.query(
    `INSERT INTO public.tenants
      (id, name, schema, domain, is_active, created_at, updated_at, tenant_type)
     VALUES ($1::uuid, $2, $3, $4, true, NOW(), NOW(), 'personal_health')`,
    [tenantId, displayName, schemaName, domain],
  );
  await postgresService.createTenantSchema(schemaName);
  await postgresService.query(
    `INSERT INTO public.user_tenants
      (user_id, tenant_id, is_primary, role, is_active, status)
     VALUES ($1::uuid, $2::uuid, false, 'patient', true, 'active')`,
    [userId, tenantId],
  );
  await postgresService.query(
    `INSERT INTO public.personal_health_tenants (user_id, tenant_id)
     VALUES ($1::uuid, $2::uuid)`,
    [userId, tenantId],
  );
}

/**
 * Idempotent: skip if personal_health_tenants already exists for user.
 */
export async function ensurePersonalHealthWorkspaceForUser(args: {
  userId: string;
  fullName: string;
  role: string;
  primaryTenantId: string;
}): Promise<void> {
  const exists = await postgresService.query(
    `SELECT 1 FROM public.personal_health_tenants WHERE user_id = $1::uuid LIMIT 1`,
    [args.userId],
  );
  if (exists.rows.length > 0) return;

  if (isProfessionalRole(args.role)) {
    await createDedicatedPersonalHealthTenant(args.userId, args.fullName);
    return;
  }

  await linkPrimaryTenantAsPersonalHealth(args.userId, args.primaryTenantId);
}

/**
 * One-off backfill: professionals without a personal_health_tenants row.
 */
export async function backfillProfessionalsMissingPersonalHealth(): Promise<number> {
  const r = await postgresService.query(
    `SELECT u.id, u.full_name
     FROM auth.users u
     WHERE u.role IN ('doctor', 'cabinet_owner', 'pharmacist', 'pharmacy_owner')
       AND NOT EXISTS (
         SELECT 1 FROM public.personal_health_tenants p WHERE p.user_id = u.id
       )`,
  );
  const rows = r.rows as { id: string; full_name: string | null }[];
  for (const row of rows) {
    await createDedicatedPersonalHealthTenant(
      row.id,
      row.full_name?.trim() || "User",
    );
  }
  return rows.length;
}
