import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { postgresService } from "../../../shared/services/postgresService.ts";

const ALLOWED_DEVICE_TYPES = new Set([
  "apple_watch",
  "fitbit",
  "oura_ring",
  "samsung_galaxy_watch",
  "garmin",
  "whoop",
]);

/** Must match migration / SchemaManager (prevents identifier injection). */
const TENANT_SCHEMA_SAFE = /^tenant_[a-zA-Z0-9_]+$/;

const router = new Router();

function wearablesRelation(schema: string): string {
  if (!TENANT_SCHEMA_SAFE.test(schema)) {
    throw new Error("Invalid tenant schema name");
  }
  return `"${schema}".user_wearables`;
}

/** Tenant row uses `domain` = auth user id (see TenantManager.createTenantForUser). */
async function resolveTenantSchemaForUser(
  userId: string,
): Promise<string | null> {
  const r = await postgresService.query(
    `SELECT schema FROM public.tenants WHERE domain = $1 LIMIT 1`,
    [userId],
  );
  const schema = (r.rows[0] as { schema?: string } | undefined)?.schema;
  if (!schema || !TENANT_SCHEMA_SAFE.test(schema)) return null;
  return schema;
}

function rowToWearable(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    device_type: row.device_type as string,
    device_name: row.device_name as string,
    device_id: row.device_id as string,
    connection_status: row.connection_status as string,
    last_synced: row.last_synced
      ? new Date(row.last_synced as string).toISOString()
      : null,
    battery_level:
      row.battery_level === null || row.battery_level === undefined
        ? null
        : Number(row.battery_level),
    meta: row.meta ?? null,
    access_token: row.access_token ?? null,
    refresh_token: row.refresh_token ?? null,
    token_expires_at: row.token_expires_at
      ? new Date(row.token_expires_at as string).toISOString()
      : null,
    created_at: new Date(row.created_at as string).toISOString(),
    updated_at: new Date(row.updated_at as string).toISOString(),
  };
}

/** GET /api/wearables — current user's devices (tenant schema) */
router.get("/api/wearables", async (ctx) => {
  const userId = ctx.state.user?.id as string | undefined;
  if (!userId) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  try {
    const schema = await resolveTenantSchemaForUser(userId);
    if (!schema) {
      ctx.response.status = 503;
      ctx.response.body = {
        error: "Tenant not provisioned",
        detail: "No tenant schema found for this user.",
      };
      return;
    }

    const rel = wearablesRelation(schema);
    const result = await postgresService.query(
      `SELECT * FROM ${rel}
       WHERE user_id = $1::uuid
       ORDER BY updated_at DESC`,
      [userId],
    );
    ctx.response.body = {
      wearables: result.rows.map((r) => rowToWearable(r as Record<string, unknown>)),
    };
  } catch (e) {
    console.error("[wearables] list error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to load wearables" };
  }
});

/** POST /api/wearables */
router.post("/api/wearables", async (ctx) => {
  const userId = ctx.state.user?.id as string | undefined;
  if (!userId) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  try {
    const schema = await resolveTenantSchemaForUser(userId);
    if (!schema) {
      ctx.response.status = 503;
      ctx.response.body = {
        error: "Tenant not provisioned",
        detail: "No tenant schema found for this user.",
      };
      return;
    }

    const body = await ctx.request.body({ type: "json" }).value;
    const device_type = body?.device_type as string | undefined;
    const device_name = body?.device_name as string | undefined;
    const device_id = body?.device_id as string | undefined;
    const connection_status = (body?.connection_status as string) ?? "connected";
    const last_synced = body?.last_synced as string | undefined;
    const battery_level = body?.battery_level as number | null | undefined;
    const meta = body?.meta;

    if (!device_type || !ALLOWED_DEVICE_TYPES.has(device_type)) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid or missing device_type" };
      return;
    }
    if (!device_name || !device_id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "device_name and device_id are required" };
      return;
    }

    const rel = wearablesRelation(schema);
    const insert = await postgresService.query(
      `INSERT INTO ${rel} (
        user_id, device_type, device_name, device_id, connection_status,
        last_synced, battery_level, meta, updated_at
      ) VALUES (
        $1::uuid, $2, $3, $4, $5,
        $6::timestamptz, $7, $8::jsonb, NOW()
      )
      RETURNING *`,
      [
        userId,
        device_type,
        device_name,
        device_id,
        connection_status,
        last_synced ?? null,
        battery_level ?? null,
        meta === undefined || meta === null
          ? null
          : JSON.stringify(meta),
      ],
    );

    const row = insert.rows[0] as Record<string, unknown>;
    ctx.response.status = 201;
    ctx.response.body = { wearable: rowToWearable(row) };
  } catch (e) {
    console.error("[wearables] create error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to connect wearable" };
  }
});

/** PATCH /api/wearables/:id */
router.patch("/api/wearables/:id", async (ctx) => {
  const userId = ctx.state.user?.id as string | undefined;
  const id = ctx.params.id;
  if (!userId) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  try {
    const schema = await resolveTenantSchemaForUser(userId);
    if (!schema) {
      ctx.response.status = 503;
      ctx.response.body = {
        error: "Tenant not provisioned",
        detail: "No tenant schema found for this user.",
      };
      return;
    }

    const body = await ctx.request.body({ type: "json" }).value;
    const updates: string[] = [];
    const params: unknown[] = [];

    if (body.last_synced !== undefined) {
      updates.push(`last_synced = $${params.length + 1}::timestamptz`);
      params.push(body.last_synced);
    }
    if (body.battery_level !== undefined) {
      updates.push(`battery_level = $${params.length + 1}`);
      params.push(body.battery_level);
    }
    if (body.connection_status !== undefined) {
      updates.push(`connection_status = $${params.length + 1}`);
      params.push(body.connection_status);
    }
    if (body.meta !== undefined) {
      updates.push(`meta = $${params.length + 1}::jsonb`);
      params.push(
        body.meta === null ? null : JSON.stringify(body.meta),
      );
    }

    if (updates.length === 0) {
      ctx.response.status = 400;
      ctx.response.body = { error: "No fields to update" };
      return;
    }

    updates.push("updated_at = NOW()");
    const idPlaceholder = params.length + 1;
    const userPlaceholder = params.length + 2;
    params.push(id, userId);

    const rel = wearablesRelation(schema);
    const sql = `UPDATE ${rel} SET ${updates.join(", ")}
      WHERE id = $${idPlaceholder}::uuid AND user_id = $${userPlaceholder}::uuid
      RETURNING *`;

    const result = await postgresService.query(sql, params);
    if (result.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Wearable not found" };
      return;
    }

    ctx.response.body = {
      wearable: rowToWearable(result.rows[0] as Record<string, unknown>),
    };
  } catch (e) {
    console.error("[wearables] patch error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to update wearable" };
  }
});

/** DELETE /api/wearables/:id */
router.delete("/api/wearables/:id", async (ctx) => {
  const userId = ctx.state.user?.id as string | undefined;
  const id = ctx.params.id;
  if (!userId) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  try {
    const schema = await resolveTenantSchemaForUser(userId);
    if (!schema) {
      ctx.response.status = 503;
      ctx.response.body = {
        error: "Tenant not provisioned",
        detail: "No tenant schema found for this user.",
      };
      return;
    }

    const rel = wearablesRelation(schema);
    const result = await postgresService.query(
      `DELETE FROM ${rel}
       WHERE id = $1::uuid AND user_id = $2::uuid
       RETURNING id`,
      [id, userId],
    );
    if (result.rows.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Wearable not found" };
      return;
    }
    ctx.response.status = 204;
    ctx.response.body = null;
  } catch (e) {
    console.error("[wearables] delete error:", e);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to disconnect wearable" };
  }
});

export const wearablesRoutes = router;
