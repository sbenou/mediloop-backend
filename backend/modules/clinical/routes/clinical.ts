import { Context, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import type { ResolvedActiveContext } from "../../auth/types/activeContext.ts";
import { postgresService } from "../../../shared/services/postgresService.ts";

const router = new Router();

type JwtUser = {
  id: string;
  role?: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getActiveContext(ctx: Context): ResolvedActiveContext | undefined {
  return (ctx.state as { activeContext?: ResolvedActiveContext }).activeContext;
}

function parseUuid(value: unknown): string | null {
  if (typeof value !== "string" || !UUID_RE.test(value.trim())) return null;
  return value.trim();
}

function roleLower(ctx: Context): string {
  const user = ctx.state.user as JwtUser | undefined;
  return (user?.role || "").toLowerCase();
}

/** Option C Phase 4: workspace lists only see rows attributed to that tenant. */
const TENANT_SCOPE = (alias: string, paramIndex: number) =>
  ` AND ${alias}.professional_tenant_id = $${paramIndex}::uuid
    AND ${alias}.attribution_status = 'attributed'::public.clinical_attribution_status`;

const LEGACY_ROW_BODY = {
  error: "legacy_row_not_mutable",
  message:
    "This clinical record is not workspace-attributed. It cannot be changed from a normal professional route; use review or admin flow.",
} as const;

function isAttributedWorkspaceRow(
  row: { professional_tenant_id?: unknown; attribution_status?: unknown },
): boolean {
  return (
    row.professional_tenant_id != null &&
    String(row.attribution_status) === "attributed"
  );
}

function requireActiveContext(
  ctx: Context,
): ResolvedActiveContext | null {
  const ac = getActiveContext(ctx);
  if (!ac?.tenantId || !ac?.membershipId) {
    ctx.response.status = 403;
    ctx.response.body = { error: "No active workspace context" };
    return null;
  }
  return ac;
}

async function readJson(
  ctx: Context,
): Promise<Record<string, unknown> | null> {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    if (body != null && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    return {};
  } catch {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid JSON body" };
    return null;
  }
}

async function userExists(userId: string): Promise<boolean> {
  const r = await postgresService.query(
    `SELECT 1 FROM auth.users WHERE id = $1::uuid LIMIT 1`,
    [userId],
  );
  return r.rows.length > 0;
}

async function doctorHasMembershipInTenant(
  doctorUserId: string,
  tenantId: string,
): Promise<boolean> {
  const r = await postgresService.query(
    `SELECT 1 FROM public.user_tenants
     WHERE user_id = $1::uuid AND tenant_id = $2::uuid
     LIMIT 1`,
    [doctorUserId, tenantId],
  );
  return r.rows.length > 0;
}

function mapDoctorPatientConnectionRows(
  rows: Record<string, unknown>[],
  options?: { forPatient?: boolean },
): Record<string, unknown>[] {
  return rows.map((row) => {
    const base: Record<string, unknown> = {
      id: String(row.id),
      doctor_id: String(row.doctor_id),
      patient_id: String(row.patient_id),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      professional_tenant_id: row.professional_tenant_id ?? null,
      created_by_membership_id: row.created_by_membership_id ?? null,
      attribution_status: row.attribution_status ?? null,
      doctor: {
        id: String(row.doctor_id),
        full_name: (row.doctor_full_name as string) ?? "Unknown Doctor",
        email: (row.doctor_email as string | null) ?? null,
        license_number: null,
      },
      patient: {
        id: String(row.patient_id),
        full_name: (row.patient_full_name as string) ?? "Unknown Patient",
        email: (row.patient_email as string | null) ?? null,
      },
    };
    if (options?.forPatient) {
      delete base.professional_tenant_id;
      delete base.created_by_membership_id;
      delete base.attribution_status;
    }
    return base;
  });
}

/** Patient-safe prescription shape — no internal workspace / membership ids. */
function mapPrescriptionRowForPatient(
  row: Record<string, unknown>,
): Record<string, unknown> {
  return {
    id: String(row.id),
    doctor_id: String(row.doctor_id),
    patient_id: String(row.patient_id),
    medication_name: row.medication_name,
    dosage: row.dosage,
    frequency: row.frequency,
    duration: row.duration,
    notes: row.notes ?? null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    doctor_full_name: row.doctor_full_name ?? null,
    patient_full_name: row.patient_full_name ?? null,
    issued_by_workspace_name: row.issued_by_workspace_name ?? null,
  };
}

/**
 * GET /api/clinical/platform-stats — public aggregate counts (Neon).
 * Mounted in `main.ts` **before** `authMiddleware` so marketing / home never need a JWT.
 */
export async function servePlatformClinicalStats(ctx: Context): Promise<void> {
  try {
    const r = await postgresService.query(
      `SELECT
        (SELECT COUNT(*)::int FROM public.prescriptions) AS prescriptions_count,
        (SELECT COUNT(*)::int FROM public.teleconsultations) AS teleconsultations_count,
        (SELECT COUNT(*)::int FROM public.doctor_patient_connections) AS connections_count,
        (SELECT COUNT(*)::int FROM public.orders) AS orders_count,
        (SELECT COUNT(*)::int FROM public.pharmacies WHERE COALESCE(endorsed, false) = true) AS pharmacies_count,
        (SELECT COUNT(*)::int FROM auth.users WHERE LOWER(TRIM(COALESCE(role::text, ''))) = 'doctor') AS doctors_count`,
    );
    const row = r.rows[0] as Record<string, number>;
    ctx.response.body = {
      prescriptions_count: row.prescriptions_count ?? 0,
      teleconsultations_count: row.teleconsultations_count ?? 0,
      connections_count: row.connections_count ?? 0,
      orders_count: row.orders_count ?? 0,
      pharmacies_count: row.pharmacies_count ?? 0,
      doctors_count: row.doctors_count ?? 0,
    };
  } catch (e) {
    console.error("[clinical] platform-stats error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to load platform stats" };
  }
}

/** GET /api/prescriptions — filtered by JWT role (patient / doctor / pharmacist). */
router.get("/api/prescriptions", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const role = (user.role || "").toLowerCase();
  const activeContext = getActiveContext(ctx);

  try {
    if (role === "patient") {
      const result = await postgresService.query(
        `SELECT p.*, doc.full_name AS doctor_full_name, pat.full_name AS patient_full_name,
            prof_t.name AS issued_by_workspace_name
         FROM public.prescriptions p
         INNER JOIN auth.users doc ON doc.id = p.doctor_id
         INNER JOIN auth.users pat ON pat.id = p.patient_id
         LEFT JOIN public.tenants prof_t ON prof_t.id = p.professional_tenant_id
         WHERE p.patient_id = $1::uuid
         ORDER BY p.created_at DESC`,
        [user.id],
      );
      ctx.response.body = {
        prescriptions: result.rows.map((r) => mapPrescriptionRowForPatient(r)),
      };
      return;
    }

    if (role === "doctor") {
      if (!activeContext?.tenantId) {
        ctx.response.status = 403;
        ctx.response.body = { error: "No active workspace context" };
        return;
      }
      const result = await postgresService.query(
        `SELECT p.*, doc.full_name AS doctor_full_name, pat.full_name AS patient_full_name
         FROM public.prescriptions p
         INNER JOIN auth.users doc ON doc.id = p.doctor_id
         INNER JOIN auth.users pat ON pat.id = p.patient_id
         WHERE p.doctor_id = $1::uuid
         ${TENANT_SCOPE("p", 2)}
         ORDER BY p.created_at DESC`,
        [user.id, activeContext.tenantId],
      );
      ctx.response.body = { prescriptions: result.rows };
      return;
    }

    if (role === "pharmacist") {
      if (!activeContext?.tenantId) {
        ctx.response.status = 403;
        ctx.response.body = { error: "No active workspace context" };
        return;
      }
      const result = await postgresService.query(
        `SELECT p.*, doc.full_name AS doctor_full_name, pat.full_name AS patient_full_name
         FROM public.prescriptions p
         INNER JOIN auth.users doc ON doc.id = p.doctor_id
         INNER JOIN auth.users pat ON pat.id = p.patient_id
         WHERE 1=1
         ${TENANT_SCOPE("p", 1)}
         ORDER BY p.created_at DESC`,
        [activeContext.tenantId],
      );
      ctx.response.body = { prescriptions: result.rows };
      return;
    }

    ctx.response.body = { prescriptions: [] };
  } catch (e) {
    console.error("[clinical] prescriptions list error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to load prescriptions" };
  }
});

/** POST /api/prescriptions — doctor; sets professional_tenant_id + created_by_membership_id. */
router.post("/api/prescriptions", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  if (roleLower(ctx) !== "doctor") {
    ctx.response.status = 403;
    ctx.response.body = { error: "Only doctors can create prescriptions" };
    return;
  }
  const ac = requireActiveContext(ctx);
  if (!ac) return;

  const raw = await readJson(ctx);
  if (raw === null) return;

  const patientId = parseUuid(raw.patient_id);
  const medicationName = typeof raw.medication_name === "string"
    ? raw.medication_name.trim()
    : "";
  const dosage = typeof raw.dosage === "string" ? raw.dosage.trim() : "";
  const frequency = typeof raw.frequency === "string"
    ? raw.frequency.trim()
    : "";
  const duration = typeof raw.duration === "string" ? raw.duration.trim() : "";
  const notes = typeof raw.notes === "string" ? raw.notes.trim() : null;
  const statusRaw = typeof raw.status === "string"
    ? raw.status.trim().toLowerCase()
    : "draft";
  const allowedStatus = new Set(["draft", "active", "completed"]);
  const status = allowedStatus.has(statusRaw) ? statusRaw : "draft";

  if (!patientId || !medicationName || !dosage || !frequency || !duration) {
    ctx.response.status = 400;
    ctx.response.body = {
      error:
        "patient_id (uuid), medication_name, dosage, frequency, and duration are required",
    };
    return;
  }

  if (patientId === user.id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "patient_id cannot be the prescribing doctor" };
    return;
  }

  if (!(await userExists(patientId))) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Unknown patient_id" };
    return;
  }

  try {
    const result = await postgresService.query(
      `INSERT INTO public.prescriptions
        (doctor_id, patient_id, medication_name, dosage, frequency, duration, notes, status,
         professional_tenant_id, created_by_membership_id)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::prescription_status, $9::uuid, $10::uuid)
       RETURNING *`,
      [
        user.id,
        patientId,
        medicationName,
        dosage,
        frequency,
        duration,
        notes,
        status,
        ac.tenantId,
        ac.membershipId,
      ],
    );
    ctx.response.status = 201;
    ctx.response.body = { prescription: result.rows[0] };
  } catch (e) {
    console.error("[clinical] prescription create error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to create prescription" };
  }
});

/** PUT /api/prescriptions/:id — doctor; scoped to same workspace as row (or legacy NULL). */
router.put("/api/prescriptions/:id", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  if (roleLower(ctx) !== "doctor") {
    ctx.response.status = 403;
    ctx.response.body = { error: "Only doctors can update prescriptions" };
    return;
  }
  const ac = requireActiveContext(ctx);
  if (!ac) return;

  const id = parseUuid(ctx.params.id);
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid prescription id" };
    return;
  }

  const raw = await readJson(ctx);
  if (raw === null) return;

  const medicationName = typeof raw.medication_name === "string"
    ? raw.medication_name.trim()
    : undefined;
  const dosage = typeof raw.dosage === "string" ? raw.dosage.trim() : undefined;
  const frequency = typeof raw.frequency === "string"
    ? raw.frequency.trim()
    : undefined;
  const duration = typeof raw.duration === "string"
    ? raw.duration.trim()
    : undefined;
  const notes = raw.notes === undefined
    ? undefined
    : typeof raw.notes === "string"
    ? raw.notes.trim()
    : null;
  const statusRaw = typeof raw.status === "string"
    ? raw.status.trim().toLowerCase()
    : undefined;
  const allowedStatus = new Set(["draft", "active", "completed"]);
  const status = statusRaw && allowedStatus.has(statusRaw)
    ? statusRaw
    : undefined;

  if (
    medicationName === undefined && dosage === undefined &&
    frequency === undefined && duration === undefined && notes === undefined &&
    status === undefined
  ) {
    ctx.response.status = 400;
    ctx.response.body = { error: "No fields to update" };
    return;
  }

  try {
    const meta = await postgresService.query(
      `SELECT p.id, p.professional_tenant_id, p.attribution_status::text AS attribution_status
       FROM public.prescriptions AS p
       WHERE p.id = $1::uuid AND p.doctor_id = $2::uuid`,
      [id, user.id],
    );
    const pr = meta.rows[0] as
      | {
        professional_tenant_id?: unknown;
        attribution_status?: string;
      }
      | undefined;
    if (!pr) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Prescription not found or not in this workspace" };
      return;
    }
    if (!isAttributedWorkspaceRow(pr)) {
      ctx.response.status = 409;
      ctx.response.body = LEGACY_ROW_BODY;
      return;
    }
    if (String(pr.professional_tenant_id) !== ac.tenantId) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Prescription not found or not in this workspace" };
      return;
    }

    const sets: string[] = ["updated_at = NOW()"];
    const params: unknown[] = [];
    let i = 1;

    if (medicationName !== undefined) {
      sets.push(`medication_name = $${i++}`);
      params.push(medicationName);
    }
    if (dosage !== undefined) {
      sets.push(`dosage = $${i++}`);
      params.push(dosage);
    }
    if (frequency !== undefined) {
      sets.push(`frequency = $${i++}`);
      params.push(frequency);
    }
    if (duration !== undefined) {
      sets.push(`duration = $${i++}`);
      params.push(duration);
    }
    if (notes !== undefined) {
      sets.push(`notes = $${i++}`);
      params.push(notes);
    }
    if (status !== undefined) {
      sets.push(`status = $${i++}::prescription_status`);
      params.push(status);
    }

    const baseLen = params.length;
    const idParam = baseLen + 1;
    const docParam = baseLen + 2;
    const tenParam = baseLen + 3;
    params.push(id, user.id, ac.tenantId);

    const sql =
      `UPDATE public.prescriptions AS p SET ${sets.join(", ")}
       WHERE p.id = $${idParam}::uuid AND p.doctor_id = $${docParam}::uuid
       ${TENANT_SCOPE("p", tenParam)}
       RETURNING *`;

    const result = await postgresService.query(sql, params);
    ctx.response.body = { prescription: result.rows[0] };
  } catch (e) {
    console.error("[clinical] prescription update error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to update prescription" };
  }
});

/** GET /api/prescriptions/:id — one row; same scope rules as list. */
router.get("/api/prescriptions/:id", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const id = parseUuid(ctx.params.id);
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid prescription id" };
    return;
  }

  const role = (user.role || "").toLowerCase();
  const activeContext = getActiveContext(ctx);

  try {
    const select =
      `SELECT p.*, doc.full_name AS doctor_full_name, pat.full_name AS patient_full_name
       FROM public.prescriptions p
       INNER JOIN auth.users doc ON doc.id = p.doctor_id
       INNER JOIN auth.users pat ON pat.id = p.patient_id
       WHERE p.id = $1::uuid`;

    const selectPatient =
      `SELECT p.*, doc.full_name AS doctor_full_name, pat.full_name AS patient_full_name,
          prof_t.name AS issued_by_workspace_name
       FROM public.prescriptions p
       INNER JOIN auth.users doc ON doc.id = p.doctor_id
       INNER JOIN auth.users pat ON pat.id = p.patient_id
       LEFT JOIN public.tenants prof_t ON prof_t.id = p.professional_tenant_id
       WHERE p.id = $1::uuid`;

    if (role === "superadmin") {
      const result = await postgresService.query(select, [id]);
      if (!result.rows.length) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Prescription not found" };
        return;
      }
      ctx.response.body = { prescription: result.rows[0] };
      return;
    }

    if (role === "patient") {
      const result = await postgresService.query(
        `${selectPatient} AND p.patient_id = $2::uuid`,
        [id, user.id],
      );
      if (!result.rows.length) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Prescription not found" };
        return;
      }
      ctx.response.body = {
        prescription: mapPrescriptionRowForPatient(
          result.rows[0] as Record<string, unknown>,
        ),
      };
      return;
    }

    if (role === "doctor") {
      if (!activeContext?.tenantId) {
        ctx.response.status = 403;
        ctx.response.body = { error: "No active workspace context" };
        return;
      }
      const result = await postgresService.query(
        `${select} AND p.doctor_id = $2::uuid ${TENANT_SCOPE("p", 3)}`,
        [id, user.id, activeContext.tenantId],
      );
      if (!result.rows.length) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Prescription not found" };
        return;
      }
      ctx.response.body = { prescription: result.rows[0] };
      return;
    }

    if (role === "pharmacist") {
      if (!activeContext?.tenantId) {
        ctx.response.status = 403;
        ctx.response.body = { error: "No active workspace context" };
        return;
      }
      const result = await postgresService.query(
        `${select} ${TENANT_SCOPE("p", 2)}`,
        [id, activeContext.tenantId],
      );
      if (!result.rows.length) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Prescription not found" };
        return;
      }
      ctx.response.body = { prescription: result.rows[0] };
      return;
    }

    ctx.response.status = 403;
    ctx.response.body = { error: "Not allowed" };
  } catch (e) {
    console.error("[clinical] prescription get error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to load prescription" };
  }
});

/** DELETE /api/prescriptions/:id — doctor; tenant-scoped (excludes cross-tenant rows). */
router.delete("/api/prescriptions/:id", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  if (roleLower(ctx) !== "doctor") {
    ctx.response.status = 403;
    ctx.response.body = { error: "Only doctors can delete prescriptions" };
    return;
  }
  const ac = requireActiveContext(ctx);
  if (!ac) return;

  const id = parseUuid(ctx.params.id);
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid prescription id" };
    return;
  }

  try {
    const meta = await postgresService.query(
      `SELECT p.id, p.professional_tenant_id, p.attribution_status::text AS attribution_status
       FROM public.prescriptions AS p
       WHERE p.id = $1::uuid AND p.doctor_id = $2::uuid`,
      [id, user.id],
    );
    const pr = meta.rows[0] as
      | {
        professional_tenant_id?: unknown;
        attribution_status?: string;
      }
      | undefined;
    if (!pr) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Prescription not found or not in this workspace" };
      return;
    }
    if (!isAttributedWorkspaceRow(pr)) {
      ctx.response.status = 409;
      ctx.response.body = LEGACY_ROW_BODY;
      return;
    }
    if (String(pr.professional_tenant_id) !== ac.tenantId) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Prescription not found or not in this workspace" };
      return;
    }

    const result = await postgresService.query(
      `DELETE FROM public.prescriptions AS p
       WHERE p.id = $1::uuid AND p.doctor_id = $2::uuid
       ${TENANT_SCOPE("p", 3)}
       RETURNING id`,
      [id, user.id, ac.tenantId],
    );
    if (!result.rows.length) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Prescription not found or not in this workspace" };
      return;
    }
    ctx.response.body = { ok: true, id: String(result.rows[0].id) };
  } catch (e) {
    console.error("[clinical] prescription delete error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to delete prescription" };
  }
});

/** GET /api/teleconsultations — filtered by JWT role. Pharmacists may pass `?for_doctor_id=` for a colleague in the same workspace. */
router.get("/api/teleconsultations", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const role = (user.role || "").toLowerCase();
  const activeContext = getActiveContext(ctx);
  const forDoctorRaw = ctx.request.url.searchParams.get("for_doctor_id");
  const forDoctorId = forDoctorRaw ? parseUuid(forDoctorRaw) : null;

  try {
    const baseSelect =
      `SELECT t.*,
        dp.id AS patient_user_id, dp.full_name AS patient_full_name, dp.email AS patient_email,
        dd.id AS doctor_user_id, dd.full_name AS doctor_full_name, dd.email AS doctor_email,
        prof_t.name AS issued_by_workspace_name
       FROM public.teleconsultations t
       INNER JOIN auth.users dp ON dp.id = t.patient_id
       INNER JOIN auth.users dd ON dd.id = t.doctor_id
       LEFT JOIN public.tenants prof_t ON prof_t.id = t.professional_tenant_id`;

    if (role === "patient") {
      const result = await postgresService.query(
        `${baseSelect} WHERE t.patient_id = $1::uuid ORDER BY t.start_time ASC`,
        [user.id],
      );
      ctx.response.body = {
        consultations: mapTeleconsultationRows(result.rows, { forPatient: true }),
      };
      return;
    }

    if (role === "doctor") {
      if (!activeContext?.tenantId) {
        ctx.response.status = 403;
        ctx.response.body = { error: "No active workspace context" };
        return;
      }
      if (forDoctorId && forDoctorId !== user.id) {
        ctx.response.status = 403;
        ctx.response.body = { error: "Doctors may only list their own consultations" };
        return;
      }
      const result = await postgresService.query(
        `${baseSelect}
         WHERE t.doctor_id = $1::uuid
         ${TENANT_SCOPE("t", 2)}
         ORDER BY t.start_time ASC`,
        [user.id, activeContext.tenantId],
      );
      ctx.response.body = { consultations: mapTeleconsultationRows(result.rows) };
      return;
    }

    if (role === "pharmacist") {
      if (!activeContext?.tenantId) {
        ctx.response.status = 403;
        ctx.response.body = { error: "No active workspace context" };
        return;
      }
      if (forDoctorId) {
        const ok = await doctorHasMembershipInTenant(
          forDoctorId,
          activeContext.tenantId,
        );
        if (!ok) {
          ctx.response.status = 403;
          ctx.response.body = {
            error: "Doctor is not a member of this workspace",
          };
          return;
        }
        const result = await postgresService.query(
          `${baseSelect}
           WHERE t.doctor_id = $1::uuid
           ${TENANT_SCOPE("t", 2)}
           ORDER BY t.start_time ASC`,
          [forDoctorId, activeContext.tenantId],
        );
        ctx.response.body = { consultations: mapTeleconsultationRows(result.rows) };
        return;
      }
      const result = await postgresService.query(
        `${baseSelect}
         WHERE 1=1
         ${TENANT_SCOPE("t", 1)}
         ORDER BY t.start_time ASC`,
        [activeContext.tenantId],
      );
      ctx.response.body = { consultations: mapTeleconsultationRows(result.rows) };
      return;
    }

    ctx.response.body = { consultations: [] };
  } catch (e) {
    console.error("[clinical] teleconsultations list error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to load teleconsultations" };
  }
});

/** POST /api/teleconsultations — doctor creates booking for a patient. */
router.post("/api/teleconsultations", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  if (roleLower(ctx) !== "doctor") {
    ctx.response.status = 403;
    ctx.response.body = { error: "Only doctors can create teleconsultations" };
    return;
  }
  const ac = requireActiveContext(ctx);
  if (!ac) return;

  const raw = await readJson(ctx);
  if (raw === null) return;

  const patientId = parseUuid(raw.patient_id);
  const startRaw = typeof raw.start_time === "string" ? raw.start_time : "";
  const endRaw = typeof raw.end_time === "string" ? raw.end_time : "";
  const reason = typeof raw.reason === "string" ? raw.reason.trim() : null;
  const roomId = typeof raw.room_id === "string" ? raw.room_id.trim() : null;
  const statusRaw = typeof raw.status === "string"
    ? raw.status.trim().toLowerCase()
    : "pending";
  const allowed = new Set(["pending", "confirmed", "cancelled", "completed"]);
  const status = allowed.has(statusRaw) ? statusRaw : "pending";

  if (!patientId || !startRaw || !endRaw) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: "patient_id, start_time, and end_time (ISO 8601) are required",
    };
    return;
  }

  const start = new Date(startRaw);
  const end = new Date(endRaw);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid start_time or end_time" };
    return;
  }
  if (end <= start) {
    ctx.response.status = 400;
    ctx.response.body = { error: "end_time must be after start_time" };
    return;
  }

  if (patientId === user.id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "patient_id cannot be the doctor" };
    return;
  }

  if (!(await userExists(patientId))) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Unknown patient_id" };
    return;
  }

  try {
    const result = await postgresService.query(
      `INSERT INTO public.teleconsultations
        (patient_id, doctor_id, start_time, end_time, status, reason, room_id,
         professional_tenant_id, created_by_membership_id)
       VALUES ($1::uuid, $2::uuid, $3::timestamptz, $4::timestamptz, $5::teleconsultation_status, $6, $7, $8::uuid, $9::uuid)
       RETURNING *`,
      [
        patientId,
        user.id,
        start.toISOString(),
        end.toISOString(),
        status,
        reason,
        roomId,
        ac.tenantId,
        ac.membershipId,
      ],
    );
    ctx.response.status = 201;
    ctx.response.body = { consultation: mapTeleconsultationRows(result.rows)[0] };
  } catch (e) {
    console.error("[clinical] teleconsultation create error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to create teleconsultation" };
  }
});

/** PATCH /api/teleconsultations/:id — doctor (full) or patient (cancel only) in-scope row. */
router.patch("/api/teleconsultations/:id", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const id = parseUuid(ctx.params.id);
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid id" };
    return;
  }

  const raw = await readJson(ctx);
  if (raw === null) return;

  const role = roleLower(ctx);

  try {
    if (role === "doctor") {
      const ac = requireActiveContext(ctx);
      if (!ac) return;

      const statusRaw = typeof raw.status === "string"
        ? raw.status.trim().toLowerCase()
        : undefined;
      const reason = typeof raw.reason === "string" ? raw.reason.trim() : undefined;
      const roomId = typeof raw.room_id === "string"
        ? raw.room_id.trim()
        : undefined;
      const startRaw = typeof raw.start_time === "string"
        ? raw.start_time
        : undefined;
      const endRaw = typeof raw.end_time === "string" ? raw.end_time : undefined;

      const allowed = new Set(["pending", "confirmed", "cancelled", "completed"]);
      const status = statusRaw && allowed.has(statusRaw) ? statusRaw : undefined;

      if (
        status === undefined && reason === undefined && roomId === undefined &&
        startRaw === undefined && endRaw === undefined
      ) {
        ctx.response.status = 400;
        ctx.response.body = { error: "No fields to update" };
        return;
      }

      const sets: string[] = ["updated_at = NOW()"];
      const params: unknown[] = [];
      let i = 1;

      if (status !== undefined) {
        sets.push(`status = $${i++}::teleconsultation_status`);
        params.push(status);
      }
      if (reason !== undefined) {
        sets.push(`reason = $${i++}`);
        params.push(reason);
      }
      if (roomId !== undefined) {
        sets.push(`room_id = $${i++}`);
        params.push(roomId);
      }
      if (startRaw !== undefined) {
        const d = new Date(startRaw);
        if (Number.isNaN(d.getTime())) {
          ctx.response.status = 400;
          ctx.response.body = { error: "Invalid start_time" };
          return;
        }
        sets.push(`start_time = $${i++}::timestamptz`);
        params.push(d.toISOString());
      }
      if (endRaw !== undefined) {
        const d = new Date(endRaw);
        if (Number.isNaN(d.getTime())) {
          ctx.response.status = 400;
          ctx.response.body = { error: "Invalid end_time" };
          return;
        }
        sets.push(`end_time = $${i++}::timestamptz`);
        params.push(d.toISOString());
      }

      const baseLen = params.length;
      const idP = baseLen + 1;
      const docP = baseLen + 2;
      const tenP = baseLen + 3;
      params.push(id, user.id, ac.tenantId);

      const metaTc = await postgresService.query(
        `SELECT t.id, t.professional_tenant_id, t.attribution_status::text AS attribution_status
         FROM public.teleconsultations AS t
         WHERE t.id = $1::uuid AND t.doctor_id = $2::uuid`,
        [id, user.id],
      );
      const trow = metaTc.rows[0] as
        | {
          professional_tenant_id?: unknown;
          attribution_status?: string;
        }
        | undefined;
      if (!trow) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Consultation not found or not in this workspace" };
        return;
      }
      if (!isAttributedWorkspaceRow(trow)) {
        ctx.response.status = 409;
        ctx.response.body = LEGACY_ROW_BODY;
        return;
      }
      if (String(trow.professional_tenant_id) !== ac.tenantId) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Consultation not found or not in this workspace" };
        return;
      }

      const sql =
        `UPDATE public.teleconsultations AS t SET ${sets.join(", ")}
         WHERE t.id = $${idP}::uuid AND t.doctor_id = $${docP}::uuid
         ${TENANT_SCOPE("t", tenP)}
         RETURNING *`;

      const result = await postgresService.query(sql, params);
      if (!result.rows.length) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Consultation not found or not in this workspace" };
        return;
      }
      ctx.response.body = { consultation: mapTeleconsultationRows(result.rows)[0] };
      return;
    }

    if (role === "patient") {
      const statusRaw = typeof raw.status === "string"
        ? raw.status.trim().toLowerCase()
        : "";
      if (statusRaw !== "cancelled") {
        ctx.response.status = 400;
        ctx.response.body = { error: "Patients may only set status to cancelled" };
        return;
      }
      const result = await postgresService.query(
        `UPDATE public.teleconsultations
         SET status = 'cancelled'::teleconsultation_status, updated_at = NOW()
         WHERE id = $1::uuid AND patient_id = $2::uuid
         RETURNING *`,
        [id, user.id],
      );
      if (!result.rows.length) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Consultation not found" };
        return;
      }
      const patched = await postgresService.query(
        `SELECT t.*,
          dp.id AS patient_user_id, dp.full_name AS patient_full_name, dp.email AS patient_email,
          dd.id AS doctor_user_id, dd.full_name AS doctor_full_name, dd.email AS doctor_email,
          prof_t.name AS issued_by_workspace_name
         FROM public.teleconsultations t
         INNER JOIN auth.users dp ON dp.id = t.patient_id
         INNER JOIN auth.users dd ON dd.id = t.doctor_id
         LEFT JOIN public.tenants prof_t ON prof_t.id = t.professional_tenant_id
         WHERE t.id = $1::uuid`,
        [id],
      );
      ctx.response.body = {
        consultation: mapTeleconsultationRows(patched.rows, { forPatient: true })[0],
      };
      return;
    }

    ctx.response.status = 403;
    ctx.response.body = { error: "Not allowed to update teleconsultations" };
  } catch (e) {
    console.error("[clinical] teleconsultation patch error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to update teleconsultation" };
  }
});

function mapTeleconsultationRows(
  rows: Record<string, unknown>[],
  options?: { forPatient?: boolean },
): Record<string, unknown>[] {
  const iso = (v: unknown) =>
    v == null ? "" : new Date(v as string).toISOString();
  return rows.map((row) => {
    if (options?.forPatient) {
      return {
        id: String(row.id),
        patient_id: String(row.patient_id),
        doctor_id: String(row.doctor_id),
        start_time: iso(row.start_time),
        end_time: iso(row.end_time),
        status: row.status,
        reason: row.reason,
        room_id: row.room_id,
        created_at: iso(row.created_at),
        updated_at: iso(row.updated_at),
        issued_by_workspace_name: row.issued_by_workspace_name ?? null,
        patient: {
          id: row.patient_user_id != null ? String(row.patient_user_id) : undefined,
          full_name: (row.patient_full_name as string) ?? "Unknown Patient",
          email: (row.patient_email as string | null) ?? null,
        },
        doctor: {
          id: row.doctor_user_id != null ? String(row.doctor_user_id) : undefined,
          full_name: (row.doctor_full_name as string) ?? "Unknown Doctor",
          email: (row.doctor_email as string | null) ?? null,
        },
        meta: {},
      };
    }
    return {
      id: String(row.id),
      patient_id: String(row.patient_id),
      doctor_id: String(row.doctor_id),
      start_time: iso(row.start_time),
      end_time: iso(row.end_time),
      status: row.status,
      reason: row.reason,
      room_id: row.room_id,
      created_at: iso(row.created_at),
      updated_at: iso(row.updated_at),
      professional_tenant_id: row.professional_tenant_id ?? null,
      created_by_membership_id: row.created_by_membership_id ?? null,
      attribution_status: row.attribution_status ?? null,
      issued_by_workspace_name: row.issued_by_workspace_name ?? null,
      patient: {
        id: row.patient_user_id != null ? String(row.patient_user_id) : undefined,
        full_name: (row.patient_full_name as string) ?? "Unknown Patient",
        email: (row.patient_email as string | null) ?? null,
      },
      doctor: {
        id: row.doctor_user_id != null ? String(row.doctor_user_id) : undefined,
        full_name: (row.doctor_full_name as string) ?? "Unknown Doctor",
        email: (row.doctor_email as string | null) ?? null,
      },
      meta: {},
    };
  });
}

/** GET /api/clinical/has-accepted-doctor — patient: any accepted doctor link? */
router.get("/api/clinical/has-accepted-doctor", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const role = (user.role || "").toLowerCase();

  if (role !== "patient") {
    ctx.response.body = { hasAcceptedDoctor: true };
    return;
  }

  try {
    const result = await postgresService.query(
      `SELECT COUNT(*)::int AS n
       FROM public.doctor_patient_connections
       WHERE patient_id = $1::uuid AND status = 'accepted'`,
      [user.id],
    );
    const n = (result.rows[0] as { n?: number })?.n ?? 0;
    ctx.response.body = { hasAcceptedDoctor: n > 0 };
  } catch (e) {
    console.error("[clinical] doctor-connections error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to check doctor connections" };
  }
});

/** GET /api/clinical/doctor-patient-connections — patient or doctor; scoped lists. */
router.get("/api/clinical/doctor-patient-connections", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const role = roleLower(ctx);
  const ac = getActiveContext(ctx);

  try {
    const base =
      `SELECT c.*,
        doc.full_name AS doctor_full_name, doc.email AS doctor_email,
        pat.full_name AS patient_full_name, pat.email AS patient_email
       FROM public.doctor_patient_connections c
       INNER JOIN auth.users doc ON doc.id = c.doctor_id
       INNER JOIN auth.users pat ON pat.id = c.patient_id`;

    if (role === "patient") {
      const result = await postgresService.query(
        `${base} WHERE c.patient_id = $1::uuid ORDER BY c.created_at DESC`,
        [user.id],
      );
      ctx.response.body = {
        connections: mapDoctorPatientConnectionRows(result.rows, {
          forPatient: true,
        }),
      };
      return;
    }

    if (role === "doctor") {
      if (!ac?.tenantId) {
        ctx.response.status = 403;
        ctx.response.body = { error: "No active workspace context" };
        return;
      }
      const result = await postgresService.query(
        `${base}
         WHERE c.doctor_id = $1::uuid
         ${TENANT_SCOPE("c", 2)}
         ORDER BY c.created_at DESC`,
        [user.id, ac.tenantId],
      );
      ctx.response.body = {
        connections: mapDoctorPatientConnectionRows(result.rows),
      };
      return;
    }

    if (role === "pharmacist") {
      if (!ac?.tenantId) {
        ctx.response.status = 403;
        ctx.response.body = { error: "No active workspace context" };
        return;
      }
      const result = await postgresService.query(
        `${base}
         WHERE 1=1
         ${TENANT_SCOPE("c", 1)}
         ORDER BY c.created_at DESC`,
        [ac.tenantId],
      );
      ctx.response.body = {
        connections: mapDoctorPatientConnectionRows(result.rows),
      };
      return;
    }

    ctx.response.status = 403;
    ctx.response.body = { error: "Not allowed to list connections" };
  } catch (e) {
    console.error("[clinical] doctor-patient connections list error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to load connections" };
  }
});

/**
 * POST /api/clinical/doctor-patient-connections
 * - Doctor: body `{ patient_id }`, sets workspace attribution.
 * - Patient: body `{ doctor_id }`, pending request (no professional tenant on row).
 */
router.post("/api/clinical/doctor-patient-connections", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const raw = await readJson(ctx);
  if (raw === null) return;

  const role = roleLower(ctx);

  if (role === "doctor") {
    const ac = requireActiveContext(ctx);
    if (!ac) return;

    const patientId = parseUuid(raw.patient_id);
    if (!patientId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "patient_id (uuid) is required" };
      return;
    }
    if (patientId === user.id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "patient_id cannot be the doctor" };
      return;
    }
    if (!(await userExists(patientId))) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Unknown patient_id" };
      return;
    }

    try {
      const result = await postgresService.query(
        `INSERT INTO public.doctor_patient_connections
          (doctor_id, patient_id, status, professional_tenant_id, created_by_membership_id)
         VALUES ($1::uuid, $2::uuid, 'pending'::connection_status, $3::uuid, $4::uuid)
         RETURNING *`,
        [user.id, patientId, ac.tenantId, ac.membershipId],
      );
      ctx.response.status = 201;
      ctx.response.body = { connection: result.rows[0] };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("unique") || msg.includes("duplicate")) {
        ctx.response.status = 409;
        ctx.response.body = {
          error: "Connection already exists for this doctor and patient",
        };
        return;
      }
      console.error("[clinical] doctor-patient connection create error:", e);
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to create connection" };
    }
    return;
  }

  if (role === "patient") {
    const doctorId = parseUuid(raw.doctor_id);
    if (!doctorId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "doctor_id (uuid) is required" };
      return;
    }
    if (doctorId === user.id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "doctor_id cannot be yourself" };
      return;
    }
    if (!(await userExists(doctorId))) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Unknown doctor_id" };
      return;
    }

    try {
      const result = await postgresService.query(
        `INSERT INTO public.doctor_patient_connections
          (doctor_id, patient_id, status, professional_tenant_id, created_by_membership_id)
         VALUES ($1::uuid, $2::uuid, 'pending'::connection_status, NULL, NULL)
         RETURNING id`,
        [doctorId, user.id],
      );
      const newId = (result.rows[0] as { id: unknown }).id;
      const full = await postgresService.query(
        `SELECT c.*,
          doc.full_name AS doctor_full_name, doc.email AS doctor_email,
          pat.full_name AS patient_full_name, pat.email AS patient_email
         FROM public.doctor_patient_connections c
         INNER JOIN auth.users doc ON doc.id = c.doctor_id
         INNER JOIN auth.users pat ON pat.id = c.patient_id
         WHERE c.id = $1::uuid`,
        [newId],
      );
      ctx.response.status = 201;
      ctx.response.body = {
        connection: mapDoctorPatientConnectionRows(full.rows, { forPatient: true })[0],
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("unique") || msg.includes("duplicate")) {
        ctx.response.status = 409;
        ctx.response.body = {
          error: "Connection already exists for this doctor and patient",
        };
        return;
      }
      console.error("[clinical] patient connection request error:", e);
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to create connection request" };
    }
    return;
  }

  ctx.response.status = 403;
  ctx.response.body = { error: "Only doctors or patients can create connections" };
});

/** PATCH /api/clinical/doctor-patient-connections/:id — patient accepts/rejects. */
router.patch("/api/clinical/doctor-patient-connections/:id", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  if (roleLower(ctx) !== "patient") {
    ctx.response.status = 403;
    ctx.response.body = { error: "Only patients can respond to connection requests" };
    return;
  }

  const id = parseUuid(ctx.params.id);
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid id" };
    return;
  }

  const raw = await readJson(ctx);
  if (raw === null) return;

  const statusRaw = typeof raw.status === "string"
    ? raw.status.trim().toLowerCase()
    : "";
  if (statusRaw !== "accepted" && statusRaw !== "rejected") {
    ctx.response.status = 400;
    ctx.response.body = { error: "status must be accepted or rejected" };
    return;
  }

  try {
    const result = await postgresService.query(
      `UPDATE public.doctor_patient_connections
       SET status = $1::connection_status, updated_at = NOW()
       WHERE id = $2::uuid AND patient_id = $3::uuid AND status = 'pending'::connection_status
       RETURNING *`,
      [statusRaw, id, user.id],
    );
    if (!result.rows.length) {
      ctx.response.status = 404;
      ctx.response.body = {
        error: "Pending connection not found or already resolved",
      };
      return;
    }
    const full = await postgresService.query(
      `SELECT c.*,
        doc.full_name AS doctor_full_name, doc.email AS doctor_email,
        pat.full_name AS patient_full_name, pat.email AS patient_email
       FROM public.doctor_patient_connections c
       INNER JOIN auth.users doc ON doc.id = c.doctor_id
       INNER JOIN auth.users pat ON pat.id = c.patient_id
       WHERE c.id = $1::uuid`,
      [id],
    );
    const mapped = mapDoctorPatientConnectionRows(full.rows, { forPatient: true });
    ctx.response.body = { connection: mapped[0] };
  } catch (e) {
    console.error("[clinical] doctor-patient connection patch error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to update connection" };
  }
});

export const clinicalRoutes = router;
