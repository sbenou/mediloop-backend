/**
 * Option C integration tests (Step 1 + Step 2)
 *
 * Covers:
 * - Step 1 schema foundations exist in DB
 * - Step 2 active context enforcement on protected routes
 * - /api/auth/me/contexts payload for workspace switcher
 * - audit_events write on denied context
 *
 * Run:
 * deno test --config backend/deno.json --allow-net --allow-env --allow-read --allow-run --unstable-kv tests/backend/optionCContext.test.ts
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { TestDb } from "../utils/testDb.ts";
import { TestServer } from "../utils/testServer.ts";

const PORT = 8003;
const testServer = new TestServer(PORT);
const testDb = new TestDb();
const runSeed = Date.now() % 200;
let requestCounter = 1;

let testEmail = "";
let testPassword = "";
let userId = "";
let accessToken = "";
let tenantAId = "";
let membershipAId = "";
let tenantBId = "";
let membershipBId = "";

const optionCTest = (
  name: string,
  fn: (t: Deno.TestContext) => void | Promise<void>,
) =>
  Deno.test({ name, sanitizeResources: false, sanitizeOps: false }, fn);

async function postJson(
  path: string,
  body: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const requestIp = `10.20.${runSeed}.${(requestCounter++ % 200) + 1}`;
  const res = await fetch(`${testServer.getBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": requestIp,
      ...(headers || {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function getWithAuth(
  path: string,
  extraHeaders?: Record<string, string>,
) {
  const requestIp = `10.20.${runSeed}.${(requestCounter++ % 200) + 1}`;
  return await fetch(`${testServer.getBaseUrl()}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Forwarded-For": requestIp,
      ...(extraHeaders || {}),
    },
  });
}

optionCTest("Option C setup - start test server and connect DB", async () => {
  await testDb.connect();
  await testServer.start();
});

optionCTest("Step 1 - schema foundations exist", async () => {
  const rows = await testDb.query<{ key: string; exists: boolean }>(
    `SELECT 'tenants.tenant_type' AS key, EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='tenants' AND column_name='tenant_type'
     ) AS exists
     UNION ALL
     SELECT 'table.personal_health_tenants' AS key, EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema='public' AND table_name='personal_health_tenants'
     ) AS exists
     UNION ALL
     SELECT 'table.tenant_invitations' AS key, EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema='public' AND table_name='tenant_invitations'
     ) AS exists
     UNION ALL
     SELECT 'user_tenants.status' AS key, EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='user_tenants' AND column_name='status'
     ) AS exists
     UNION ALL
     SELECT 'table.audit_events' AS key, EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema='public' AND table_name='audit_events'
     ) AS exists`,
  );

  for (const r of rows) {
    assertEquals(
      r.exists,
      true,
      `Expected Option C schema object to exist: ${r.key}`,
    );
  }
});

optionCTest("Option C setup - register + verify + login context test user", async () => {
  const ts = Date.now();
  testEmail = `integration-optionc-${ts}@example.com`;
  testPassword = "OptionCTest123!@#";

  // Register
  const register = await postJson("/api/auth/register", {
    email: testEmail,
    password: testPassword,
    fullName: "Option C Context Test User",
    role: "patient",
  });
  assertEquals(register.res.status, 201);

  // Verify through token from DB
  const token = await testDb.getVerificationToken(testEmail);
  assertExists(token, "Expected verification token to exist");
  const verify = await fetch(
    `${testServer.getBaseUrl()}/api/auth/verify-email?token=${encodeURIComponent(token!)}`,
  );
  assertEquals(verify.status, 200);

  // Login
  const login = await postJson("/api/auth/login", {
    email: testEmail,
    password: testPassword,
  });
  assertEquals(login.res.status, 200);
  accessToken = String(login.data.access_token || "");
  userId = String(login.data.user?.id || "");
  assert(accessToken.length > 20, "Expected access token");
  assert(userId.length > 0, "Expected user id");

  // Build a second tenant membership for context switching tests
  const createdTenant = await testDb.query<{ id: string }>(
    `INSERT INTO public.tenants (name, schema, domain, tenant_type, is_active)
     VALUES ($1, $2, $3, 'clinic', true)
     RETURNING id`,
    [
      `Clinic ${ts}`,
      `tenant_optionc_${ts}`,
      `optionc-${ts}`,
    ],
  );
  tenantBId = createdTenant[0].id;

  const createdMembership = await testDb.query<{ id: string }>(
    `INSERT INTO public.user_tenants
      (user_id, tenant_id, role, is_primary, is_active, status)
     VALUES ($1::uuid, $2::uuid, 'doctor', false, true, 'active')
     RETURNING id`,
    [userId, tenantBId],
  );
  membershipBId = createdMembership[0].id;

  // Capture original primary tenant + membership
  const primary = await testDb.query<{ tenant_id: string; id: string }>(
    `SELECT tenant_id, id
     FROM public.user_tenants
     WHERE user_id = $1::uuid
     ORDER BY is_primary DESC, created_at ASC
     LIMIT 1`,
    [userId],
  );
  tenantAId = primary[0].tenant_id;
  membershipAId = primary[0].id;
});

optionCTest("Step 2 - GET /api/auth/me/contexts returns memberships", async () => {
  const res = await getWithAuth("/api/auth/me/contexts");
  assertEquals(res.status, 200);
  const data = await res.json();

  assertEquals(data.user_id, userId);
  assert(Array.isArray(data.memberships));
  assert(
    data.memberships.some((m: { membership_id: string }) => m.membership_id === membershipAId),
    "Expected primary membership in contexts",
  );
  assert(
    data.memberships.some((m: { membership_id: string }) => m.membership_id === membershipBId),
    "Expected second membership in contexts",
  );
});

optionCTest("Step 2 - partial context headers are rejected (400)", async () => {
  const res = await getWithAuth("/api/auth/profile", {
    "X-Mediloop-Tenant-Id": tenantAId,
  });
  assertEquals(res.status, 400);
  const data = await res.json();
  assert(String(data.error || "").toLowerCase().includes("invalid workspace"));
});

optionCTest("Step 2 - valid context headers allow request (200)", async () => {
  const res = await getWithAuth("/api/auth/profile", {
    "X-Mediloop-Tenant-Id": tenantBId,
    "X-Mediloop-Membership-Id": membershipBId,
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertExists(data.profile);
});

optionCTest(
  "Step 2 - switching context across memberships stays deterministic",
  async () => {
    const first = await getWithAuth("/api/auth/profile", {
      "X-Mediloop-Tenant-Id": tenantAId,
      "X-Mediloop-Membership-Id": membershipAId,
    });
    assertEquals(first.status, 200);

    const second = await getWithAuth("/api/auth/profile", {
      "X-Mediloop-Tenant-Id": tenantBId,
      "X-Mediloop-Membership-Id": membershipBId,
    });
    assertEquals(second.status, 200);

    const third = await getWithAuth("/api/auth/profile", {
      "X-Mediloop-Tenant-Id": tenantAId,
      "X-Mediloop-Membership-Id": membershipAId,
    });
    assertEquals(third.status, 200);
  },
);

optionCTest("Step 2 - mismatched context denied and audit written", async () => {
  const beforeRows = await testDb.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c
     FROM public.audit_events
     WHERE user_id = $1::uuid
       AND action = 'active_context.denied'`,
    [userId],
  );
  const before = Number(beforeRows[0].c || 0);

  const res = await getWithAuth("/api/auth/profile", {
    "X-Mediloop-Tenant-Id": tenantAId,
    "X-Mediloop-Membership-Id": membershipBId, // mismatch on purpose
  });
  assertEquals(res.status, 403);

  const afterRows = await testDb.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c
     FROM public.audit_events
     WHERE user_id = $1::uuid
       AND action = 'active_context.denied'`,
    [userId],
  );
  const after = Number(afterRows[0].c || 0);
  assert(
    after > before,
    `Expected audit_events to increase for denied context (before=${before}, after=${after})`,
  );
});

optionCTest("Option C teardown - cleanup test data, stop server, disconnect DB", async () => {
  if (tenantBId) {
    await testDb.execute(`DELETE FROM public.tenants WHERE id = $1::uuid`, [tenantBId]);
  }
  if (testEmail) {
    await testDb.deleteTestUser(testEmail);
  }
  await testServer.stop();
  await testDb.close();
});
