import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { postgresService } from "../../../shared/services/postgresService.ts";

const router = new Router();

type JwtUser = {
  id: string;
  role?: string;
};

/** GET /api/prescriptions — filtered by JWT role (patient / doctor / pharmacist). */
router.get("/api/prescriptions", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const role = (user.role || "").toLowerCase();

  try {
    if (role === "patient") {
      const result = await postgresService.query(
        `SELECT p.*, doc.full_name AS doctor_full_name, pat.full_name AS patient_full_name
         FROM public.prescriptions p
         INNER JOIN auth.users doc ON doc.id = p.doctor_id
         INNER JOIN auth.users pat ON pat.id = p.patient_id
         WHERE p.patient_id = $1::uuid
         ORDER BY p.created_at DESC`,
        [user.id],
      );
      ctx.response.body = { prescriptions: result.rows };
      return;
    }

    if (role === "doctor") {
      const result = await postgresService.query(
        `SELECT p.*, doc.full_name AS doctor_full_name, pat.full_name AS patient_full_name
         FROM public.prescriptions p
         INNER JOIN auth.users doc ON doc.id = p.doctor_id
         INNER JOIN auth.users pat ON pat.id = p.patient_id
         WHERE p.doctor_id = $1::uuid
         ORDER BY p.created_at DESC`,
        [user.id],
      );
      ctx.response.body = { prescriptions: result.rows };
      return;
    }

    if (role === "pharmacist") {
      const result = await postgresService.query(
        `SELECT p.*, doc.full_name AS doctor_full_name, pat.full_name AS patient_full_name
         FROM public.prescriptions p
         INNER JOIN auth.users doc ON doc.id = p.doctor_id
         INNER JOIN auth.users pat ON pat.id = p.patient_id
         ORDER BY p.created_at DESC`,
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

/** GET /api/teleconsultations — filtered by JWT role. */
router.get("/api/teleconsultations", async (ctx) => {
  const user = ctx.state.user as JwtUser | undefined;
  if (!user?.id) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const role = (user.role || "").toLowerCase();

  try {
    const baseSelect =
      `SELECT t.*,
        dp.id AS patient_user_id, dp.full_name AS patient_full_name, dp.email AS patient_email,
        dd.id AS doctor_user_id, dd.full_name AS doctor_full_name, dd.email AS doctor_email
       FROM public.teleconsultations t
       INNER JOIN auth.users dp ON dp.id = t.patient_id
       INNER JOIN auth.users dd ON dd.id = t.doctor_id`;

    if (role === "patient") {
      const result = await postgresService.query(
        `${baseSelect} WHERE t.patient_id = $1::uuid ORDER BY t.start_time ASC`,
        [user.id],
      );
      ctx.response.body = { consultations: mapTeleconsultationRows(result.rows) };
      return;
    }

    if (role === "doctor") {
      const result = await postgresService.query(
        `${baseSelect} WHERE t.doctor_id = $1::uuid ORDER BY t.start_time ASC`,
        [user.id],
      );
      ctx.response.body = { consultations: mapTeleconsultationRows(result.rows) };
      return;
    }

    if (role === "pharmacist") {
      const result = await postgresService.query(
        `${baseSelect} ORDER BY t.start_time ASC`,
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

function mapTeleconsultationRows(
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  const iso = (v: unknown) =>
    v == null ? "" : new Date(v as string).toISOString();
  return rows.map((row) => ({
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
  }));
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

export const clinicalRoutes = router;
