/**
 * Pharmacist pharmacy row + metadata, doctor metadata — Neon (no Supabase).
 */
import { Context, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { postgresService } from "../../../shared/services/postgresService.ts";

const router = new Router();

type JwtUser = { id?: string; role?: string };

function roleLower(ctx: Context): string {
  return ((ctx.state.user as JwtUser)?.role || "").toLowerCase();
}

function userId(ctx: Context): string | null {
  const id = (ctx.state.user as JwtUser)?.id;
  return id ?? null;
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

async function pharmacistPharmacyIdForUser(
  uid: string,
): Promise<string | null> {
  const r = await postgresService.query(
    `SELECT pharmacy_id::text AS pharmacy_id
     FROM public.user_pharmacies
     WHERE user_id = $1::uuid
     LIMIT 1`,
    [uid],
  );
  const row = r.rows[0] as { pharmacy_id?: string } | undefined;
  return row?.pharmacy_id ?? null;
}

/** GET /api/pharmacy/workspace */
router.get("/api/pharmacy/workspace", async (ctx) => {
  const uid = userId(ctx);
  if (!uid) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  if (roleLower(ctx) !== "pharmacist") {
    ctx.response.status = 403;
    ctx.response.body = { error: "Only pharmacists may access this resource" };
    return;
  }

  const pharmacyId = await pharmacistPharmacyIdForUser(uid);
  if (!pharmacyId) {
    ctx.response.status = 404;
    ctx.response.body = { error: "No pharmacy linked to this account" };
    return;
  }

  try {
    const p = await postgresService.query(
      `SELECT p.id::text AS id, p.name, p.address, p.city, p.postal_code,
              p.phone, p.hours, p.email, p.endorsed, p.created_at
       FROM public.pharmacies p
       WHERE p.id = $1::uuid`,
      [pharmacyId],
    );
    if (!p.rows.length) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Pharmacy not found" };
      return;
    }
    let logoUrl: string | null = null;
    try {
      const m = await postgresService.query(
        `SELECT logo_url FROM public.pharmacy_metadata WHERE pharmacy_id = $1::uuid`,
        [pharmacyId],
      );
      logoUrl = (m.rows[0] as { logo_url?: string } | undefined)?.logo_url ??
        null;
    } catch {
      /* pharmacy_metadata may be missing on very old DBs */
    }
    const row = p.rows[0] as Record<string, unknown>;
    ctx.response.body = {
      pharmacy: { ...row, logo_url: logoUrl },
    };
  } catch (e) {
    console.error("[pharmacy/workspace] GET error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to load pharmacy" };
  }
});

/** PUT /api/pharmacy/workspace — update pharmacies row (+ optional logo in metadata). */
router.put("/api/pharmacy/workspace", async (ctx) => {
  const uid = userId(ctx);
  if (!uid) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  if (roleLower(ctx) !== "pharmacist") {
    ctx.response.status = 403;
    ctx.response.body = { error: "Only pharmacists may update this resource" };
    return;
  }

  const pharmacyId = await pharmacistPharmacyIdForUser(uid);
  if (!pharmacyId) {
    ctx.response.status = 404;
    ctx.response.body = { error: "No pharmacy linked to this account" };
    return;
  }

  const raw = await readJson(ctx);
  if (raw === null) return;

  const str = (k: string): string | undefined =>
    typeof raw[k] === "string" ? (raw[k] as string).trim() : undefined;
  const opt = (k: string): string | null | undefined => {
    if (raw[k] === undefined) return undefined;
    if (raw[k] === null) return null;
    if (typeof raw[k] === "string") return raw[k] as string;
    return String(raw[k]);
  };

  const name = str("name");
  const address = str("address");
  const city = str("city");
  const postal_code = str("postal_code");
  const phone = opt("phone");
  const email = opt("email");
  const hours = opt("hours");
  const logo_url = opt("logo_url");

  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  const push = (col: string, val: unknown) => {
    sets.push(`${col} = $${i}::text`);
    vals.push(val);
    i++;
  };

  if (name !== undefined) push("name", name);
  if (address !== undefined) push("address", address);
  if (city !== undefined) push("city", city);
  if (postal_code !== undefined) push("postal_code", postal_code);
  if (phone !== undefined) push("phone", phone ?? "");
  if (email !== undefined) push("email", email ?? "");
  if (hours !== undefined) push("hours", hours ?? "");

  try {
    if (sets.length) {
      vals.push(pharmacyId);
      await postgresService.query(
        `UPDATE public.pharmacies SET ${sets.join(", ")} WHERE id = $${i}::uuid`,
        vals,
      );
    }

    if (logo_url !== undefined) {
      await postgresService.query(
        `INSERT INTO public.pharmacy_metadata (pharmacy_id, logo_url, updated_at)
         VALUES ($1::uuid, $2, NOW())
         ON CONFLICT (pharmacy_id) DO UPDATE SET
           logo_url = EXCLUDED.logo_url,
           updated_at = NOW()`,
        [pharmacyId, logo_url],
      );
    }

    ctx.response.body = { ok: true };
  } catch (e) {
    console.error("[pharmacy/workspace] PUT error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to update pharmacy" };
  }
});

/** GET /api/pharmacy/workspace/team — users linked to the same pharmacy. */
router.get("/api/pharmacy/workspace/team", async (ctx) => {
  const uid = userId(ctx);
  if (!uid) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  if (roleLower(ctx) !== "pharmacist") {
    ctx.response.status = 403;
    ctx.response.body = { error: "Only pharmacists may access team list" };
    return;
  }

  const pharmacyId = await pharmacistPharmacyIdForUser(uid);
  if (!pharmacyId) {
    ctx.response.status = 404;
    ctx.response.body = { error: "No pharmacy linked to this account" };
    return;
  }

  try {
    const r = await postgresService.query(
      `SELECT u.id::text AS id,
              u.full_name,
              u.email,
              u.role::text AS role,
              u.status::text AS status
       FROM public.user_pharmacies up
       INNER JOIN auth.users u ON u.id = up.user_id
       WHERE up.pharmacy_id = $1::uuid
       ORDER BY u.full_name ASC NULLS LAST`,
      [pharmacyId],
    );
    const members = r.rows.map((row) => {
      const o = row as Record<string, unknown>;
      const blocked = String(o.status || "").toLowerCase() === "blocked";
      return {
        id: o.id,
        full_name: o.full_name,
        email: o.email,
        role: o.role,
        avatar_url: null as string | null,
        is_blocked: blocked,
      };
    });
    ctx.response.body = { members };
  } catch (e) {
    console.error("[pharmacy/workspace/team] error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to load team" };
  }
});

/** PATCH /api/pharmacy/workspace/team/:memberId — set teammate blocked (same pharmacy only). */
router.patch("/api/pharmacy/workspace/team/:memberId", async (ctx) => {
  const uid = userId(ctx);
  if (!uid) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  if (roleLower(ctx) !== "pharmacist") {
    ctx.response.status = 403;
    ctx.response.body = { error: "Only pharmacists may update team members" };
    return;
  }

  const memberId = (ctx.params.memberId || "").trim();
  if (!memberId || !isUuid(memberId)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid member id" };
    return;
  }

  if (memberId === uid) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Cannot change your own status here" };
    return;
  }

  const pharmacyId = await pharmacistPharmacyIdForUser(uid);
  if (!pharmacyId) {
    ctx.response.status = 404;
    ctx.response.body = { error: "No pharmacy linked to this account" };
    return;
  }

  const raw = await readJson(ctx);
  if (raw === null) return;

  if (typeof raw.blocked !== "boolean") {
    ctx.response.status = 400;
    ctx.response.body = { error: "blocked (boolean) is required" };
    return;
  }
  const blocked = raw.blocked;

  try {
    const same = await postgresService.query(
      `SELECT 1 FROM public.user_pharmacies
       WHERE pharmacy_id = $1::uuid AND user_id = $2::uuid LIMIT 1`,
      [pharmacyId, memberId],
    );
    if (!same.rows.length) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Team member not in your pharmacy" };
      return;
    }

    const upd = await postgresService.query(
      `UPDATE auth.users
       SET status = $1, updated_at = NOW()
       WHERE id = $2::uuid AND COALESCE(status, 'active') <> 'deleted'
       RETURNING id`,
      [blocked ? "blocked" : "active", memberId],
    );
    if (!upd.rows.length) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    ctx.response.body = { ok: true, is_blocked: blocked };
  } catch (e) {
    console.error("[pharmacy/workspace/team PATCH] error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to update team member" };
  }
});

/** GET /api/doctor/workspace */
router.get("/api/doctor/workspace", async (ctx) => {
  const uid = userId(ctx);
  if (!uid) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  if (roleLower(ctx) !== "doctor") {
    ctx.response.status = 403;
    ctx.response.body = { error: "Only doctors may access this resource" };
    return;
  }

  try {
    const u = await postgresService.query(
      `SELECT id::text AS id, full_name, email, phone
       FROM auth.users WHERE id = $1::uuid LIMIT 1`,
      [uid],
    );
    if (!u.rows.length) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }
    let meta: Record<string, unknown> = {};
    try {
      const m = await postgresService.query(
        `SELECT address, city, postal_code, logo_url, hours
         FROM public.doctor_metadata WHERE doctor_id = $1::uuid`,
        [uid],
      );
      if (m.rows.length) meta = m.rows[0] as Record<string, unknown>;
    } catch {
      /* table missing */
    }
    ctx.response.body = {
      user: u.rows[0],
      metadata: meta,
    };
  } catch (e) {
    console.error("[doctor/workspace] GET error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to load doctor workspace" };
  }
});

/** PUT /api/doctor/workspace */
router.put("/api/doctor/workspace", async (ctx) => {
  const uid = userId(ctx);
  if (!uid) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  if (roleLower(ctx) !== "doctor") {
    ctx.response.status = 403;
    ctx.response.body = { error: "Only doctors may update this resource" };
    return;
  }

  const raw = await readJson(ctx);
  if (raw === null) return;

  const str = (k: string): string | undefined =>
    typeof raw[k] === "string" ? (raw[k] as string).trim() : undefined;
  const opt = (k: string): string | null | undefined => {
    if (raw[k] === undefined) return undefined;
    if (raw[k] === null) return null;
    if (typeof raw[k] === "string") return raw[k] as string;
    return String(raw[k]);
  };

  const full_name = str("full_name");
  const phone = opt("phone");
  const address = opt("address");
  const city = opt("city");
  const postal_code = opt("postal_code");
  const logo_url = opt("logo_url");
  const hours = opt("hours");

  try {
    if (full_name !== undefined || phone !== undefined) {
      const us: string[] = [];
      const uv: unknown[] = [];
      let j = 1;
      if (full_name !== undefined) {
        us.push(`full_name = $${j}`);
        uv.push(full_name);
        j++;
      }
      if (phone !== undefined) {
        us.push(`phone = $${j}`);
        uv.push(phone ?? "");
        j++;
      }
      uv.push(uid);
      await postgresService.query(
        `UPDATE auth.users SET ${us.join(", ")}, updated_at = NOW() WHERE id = $${j}::uuid`,
        uv,
      );
    }

    const metaSets: string[] = [];
    const metaVals: unknown[] = [];
    let mi = 1;
    if (address !== undefined) {
      metaSets.push(`address = $${mi}`);
      metaVals.push(address);
      mi++;
    }
    if (city !== undefined) {
      metaSets.push(`city = $${mi}`);
      metaVals.push(city);
      mi++;
    }
    if (postal_code !== undefined) {
      metaSets.push(`postal_code = $${mi}`);
      metaVals.push(postal_code);
      mi++;
    }
    if (logo_url !== undefined) {
      metaSets.push(`logo_url = $${mi}`);
      metaVals.push(logo_url);
      mi++;
    }
    if (hours !== undefined) {
      metaSets.push(`hours = $${mi}`);
      metaVals.push(hours);
      mi++;
    }
    if (metaSets.length) {
      const exists = await postgresService.query(
        `SELECT 1 FROM public.doctor_metadata WHERE doctor_id = $1::uuid LIMIT 1`,
        [uid],
      );
      if (!exists.rows.length) {
        await postgresService.query(
          `INSERT INTO public.doctor_metadata (doctor_id) VALUES ($1::uuid)`,
          [uid],
        );
      }
      metaVals.push(uid);
      await postgresService.query(
        `UPDATE public.doctor_metadata SET ${metaSets.join(", ")}, updated_at = NOW()
         WHERE doctor_id = $${mi}::uuid`,
        metaVals,
      );
    }

    ctx.response.body = { ok: true };
  } catch (e) {
    console.error("[doctor/workspace] PUT error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to update doctor workspace" };
  }
});

export const professionalWorkspaceRoutes = router;
