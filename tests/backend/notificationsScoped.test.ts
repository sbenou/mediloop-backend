/**
 * Scoped notifications API (migration 027 + Option C context).
 *
 * Prerequisites: test DB with migrations **012**, **019** (recommended), and **027** applied.
 *
 * Run:
 * deno test --config backend/deno.json --allow-net --allow-env --allow-read --allow-run --unstable-kv tests/backend/notificationsScoped.test.ts
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { TestDb } from "../utils/testDb.ts";
import { TestServer } from "../utils/testServer.ts";

const PORT = 8006;
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
let phTenantId = "";
let phMembershipId = "";
let notifTenantA = "";
let notifTenantB = "";
let notifPh = "";
let notifPp = "";

const nScoped = (
  name: string,
  fn: (t: Deno.TestContext) => void | Promise<void>,
) =>
  Deno.test({ name, sanitizeResources: false, sanitizeOps: false }, fn);

async function postJson(
  path: string,
  body: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const requestIp = `10.21.${runSeed}.${(requestCounter++ % 200) + 1}`;
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
  const requestIp = `10.21.${runSeed}.${(requestCounter++ % 200) + 1}`;
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

nScoped("Notifications scoped - start server and DB", async () => {
  await testDb.connect();
  await testServer.start();
});

nScoped("Notifications scoped - register, verify, login, extra workspaces", async () => {
  const ts = Date.now();
  testEmail = `integration-notif-scope-${ts}@example.com`;
  testPassword = "NotifScope123!@#";

  const register = await postJson("/api/auth/register", {
    email: testEmail,
    password: testPassword,
    fullName: "Notification Scope Test",
    role: "patient",
  });
  assertEquals(register.res.status, 201);

  const token = await testDb.getVerificationToken(testEmail);
  assertExists(token);
  const verify = await fetch(
    `${testServer.getBaseUrl()}/api/auth/verify-email?token=${encodeURIComponent(token!)}`,
  );
  assertEquals(verify.status, 200);

  const login = await postJson("/api/auth/login", {
    email: testEmail,
    password: testPassword,
  });
  assertEquals(login.res.status, 200);
  accessToken = String(login.data.access_token || "");
  userId = String(login.data.user?.id || "");
  assert(accessToken.length > 20);
  assert(userId.length > 0);

  const createdB = await testDb.query<{ id: string }>(
    `INSERT INTO public.tenants (name, schema, domain, tenant_type, is_active)
     VALUES ($1, $2, $3, 'clinic', true)
     RETURNING id`,
    [`Clinic NS ${ts}`, `tenant_ns_${ts}`, `notif-scope-b-${ts}`],
  );
  tenantBId = createdB[0].id;

  const membershipB = await testDb.query<{ id: string }>(
    `INSERT INTO public.user_tenants
      (user_id, tenant_id, role, is_primary, is_active, status)
     VALUES ($1::uuid, $2::uuid, 'doctor', false, true, 'active')
     RETURNING id`,
    [userId, tenantBId],
  );
  membershipBId = membershipB[0].id;

  const createdPh = await testDb.query<{ id: string }>(
    `INSERT INTO public.tenants (name, schema, domain, tenant_type, is_active)
     VALUES ($1, $2, $3, 'personal_health', true)
     RETURNING id`,
    [`PH NS ${ts}`, `tenant_ns_ph_${ts}`, `notif-scope-ph-${ts}`],
  );
  phTenantId = createdPh[0].id;

  const membershipPh = await testDb.query<{ id: string }>(
    `INSERT INTO public.user_tenants
      (user_id, tenant_id, role, is_primary, is_active, status)
     VALUES ($1::uuid, $2::uuid, 'patient', false, true, 'active')
     RETURNING id`,
    [userId, phTenantId],
  );
  phMembershipId = membershipPh[0].id;

  await testDb.execute(
    `INSERT INTO public.personal_health_tenants (user_id, tenant_id)
     VALUES ($1::uuid, $2::uuid)
     ON CONFLICT (user_id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, updated_at = NOW()`,
    [userId, phTenantId],
  );

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

nScoped("Notifications scoped - seed rows", async () => {
  const rA = await testDb.query<{ id: string }>(
    `INSERT INTO public.notifications (
       user_id, tenant_id, title, body,
       scope_type, scope_tenant_id, scope_membership_id, workspace_kind, status
     ) VALUES (
       $1::uuid, $2, 'Tenant A', 'body-a',
       'tenant', $3::uuid, $4::uuid, 'tenant', 'unread'
     ) RETURNING id`,
    [userId, tenantAId, tenantAId, membershipAId],
  );
  notifTenantA = rA[0].id;

  const rB = await testDb.query<{ id: string }>(
    `INSERT INTO public.notifications (
       user_id, tenant_id, title, body,
       scope_type, scope_tenant_id, scope_membership_id, workspace_kind, status
     ) VALUES (
       $1::uuid, $2, 'Tenant B', 'body-b',
       'tenant', $3::uuid, $4::uuid, 'tenant', 'unread'
     ) RETURNING id`,
    [userId, tenantBId, tenantBId, membershipBId],
  );
  notifTenantB = rB[0].id;

  const rPh = await testDb.query<{ id: string }>(
    `INSERT INTO public.notifications (
       user_id, tenant_id, title, body,
       scope_type, scope_tenant_id, scope_membership_id, workspace_kind, status
     ) VALUES (
       $1::uuid, $2, 'PH', 'body-ph',
       'personal_health', $3::uuid, $4::uuid, 'personal_health', 'unread'
     ) RETURNING id`,
    [userId, phTenantId, phTenantId, phMembershipId],
  );
  notifPh = rPh[0].id;

  const rPp = await testDb.query<{ id: string }>(
    `INSERT INTO public.notifications (
       user_id, tenant_id, title, body,
       scope_type, workspace_kind, status
     ) VALUES (
       $1::uuid, NULL, 'PP', 'body-pp',
       'professional_personal', 'professional_personal', 'unread'
     ) RETURNING id`,
    [userId],
  );
  notifPp = rPp[0].id;
});

nScoped("GET /history rejects foreign userId query", async () => {
  const res = await getWithAuth(
    `/api/notifications/history?userId=00000000-0000-4000-8000-000000000001`,
    {
      "X-Mediloop-Tenant-Id": tenantAId,
      "X-Mediloop-Membership-Id": membershipAId,
    },
  );
  assertEquals(res.status, 403);
});

nScoped("GET /history tenant workspace returns only matching tenant rows", async () => {
  const res = await getWithAuth("/api/notifications/history?inbox=tenant&limit=50", {
    "X-Mediloop-Tenant-Id": tenantAId,
    "X-Mediloop-Membership-Id": membershipAId,
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  const ids = (data.notifications as { id: string }[]).map((n) => n.id);
  assert(ids.includes(notifTenantA), "Expected tenant A notification");
  assert(!ids.includes(notifTenantB), "Must not leak tenant B in tenant A inbox");
  assert(!ids.includes(notifPh));
  assert(!ids.includes(notifPp));
});

nScoped("GET /history personal_health forbidden when context is workplace", async () => {
  const res = await getWithAuth("/api/notifications/history?inbox=personal_health", {
    "X-Mediloop-Tenant-Id": tenantAId,
    "X-Mediloop-Membership-Id": membershipAId,
  });
  assertEquals(res.status, 403);
});

nScoped("GET /history personal_health with PH context", async () => {
  const res = await getWithAuth("/api/notifications/history?inbox=personal_health", {
    "X-Mediloop-Tenant-Id": phTenantId,
    "X-Mediloop-Membership-Id": phMembershipId,
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  const ids = (data.notifications as { id: string }[]).map((n) => n.id);
  assert(ids.includes(notifPh));
  assert(!ids.includes(notifTenantA));
});

nScoped("GET /history professional_personal", async () => {
  const res = await getWithAuth(
    "/api/notifications/history?inbox=professional_personal&limit=50",
  );
  assertEquals(res.status, 200);
  const data = await res.json();
  const ids = (data.notifications as { id: string }[]).map((n) => n.id);
  assert(ids.includes(notifPp));
  assert(!ids.includes(notifTenantA));
});

nScoped("POST /mark-read 404 for missing id", async () => {
  const { res, data } = await postJson(
    "/api/notifications/mark-read",
    { notificationId: "00000000-0000-4000-8000-000000000002" },
    {
      Authorization: `Bearer ${accessToken}`,
      "X-Mediloop-Tenant-Id": tenantAId,
      "X-Mediloop-Membership-Id": membershipAId,
    },
  );
  assertEquals(res.status, 404);
  assert(
    String(data.error || "").toLowerCase().includes("not found"),
    String(JSON.stringify(data)),
  );
});

nScoped("POST /mark-read rejects wrong workspace", async () => {
  const { res } = await postJson(
    "/api/notifications/mark-read",
    { notificationId: notifTenantB },
    {
      Authorization: `Bearer ${accessToken}`,
      "X-Mediloop-Tenant-Id": tenantAId,
      "X-Mediloop-Membership-Id": membershipAId,
    },
  );
  assertEquals(res.status, 403);
});

nScoped("POST /mark-read succeeds in matching workspace", async () => {
  const { res, data } = await postJson(
    "/api/notifications/mark-read",
    { notificationId: notifTenantB },
    {
      Authorization: `Bearer ${accessToken}`,
      "X-Mediloop-Tenant-Id": tenantBId,
      "X-Mediloop-Membership-Id": membershipBId,
    },
  );
  assertEquals(res.status, 200);
  assertEquals(data.success, true);
});

nScoped("POST /mark-read professional_personal requires inbox hint when auto is tenant", async () => {
  const { res: denied } = await postJson(
    "/api/notifications/mark-read",
    { notificationId: notifPp },
    {
      Authorization: `Bearer ${accessToken}`,
      "X-Mediloop-Tenant-Id": tenantAId,
      "X-Mediloop-Membership-Id": membershipAId,
    },
  );
  assertEquals(denied.status, 403);

  const { res: ok, data } = await postJson(
    "/api/notifications/mark-read",
    { notificationId: notifPp, inbox: "professional_personal" },
    {
      Authorization: `Bearer ${accessToken}`,
      "X-Mediloop-Tenant-Id": tenantAId,
      "X-Mediloop-Membership-Id": membershipAId,
    },
  );
  assertEquals(ok.status, 200);
  assertEquals(data.success, true);
});

nScoped("POST /mark-read idempotent when already read", async () => {
  const { res, data } = await postJson(
    "/api/notifications/mark-read",
    { notificationId: notifTenantB },
    {
      Authorization: `Bearer ${accessToken}`,
      "X-Mediloop-Tenant-Id": tenantBId,
      "X-Mediloop-Membership-Id": membershipBId,
    },
  );
  assertEquals(res.status, 200);
  assertEquals(data.alreadyRead, true);
});

nScoped("Notifications scoped - teardown", async () => {
  await testDb.execute(`DELETE FROM public.notifications WHERE user_id = $1::uuid`, [
    userId,
  ]);
  await testDb.execute(`DELETE FROM public.personal_health_tenants WHERE user_id = $1::uuid`, [
    userId,
  ]);
  await testDb.execute(
    `DELETE FROM public.user_tenants WHERE user_id = $1::uuid AND (tenant_id = $2::uuid OR tenant_id = $3::uuid)`,
    [userId, tenantBId, phTenantId],
  );
  await testDb.execute(`DELETE FROM public.tenants WHERE id = $1::uuid`, [tenantBId]);
  await testDb.execute(`DELETE FROM public.tenants WHERE id = $1::uuid`, [phTenantId]);
  if (testEmail) {
    await testDb.deleteTestUser(testEmail);
  }
  await testServer.stop();
  await testDb.close();
});
