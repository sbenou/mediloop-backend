/**
 * Option C Phase 3 — clinical attribution columns + tenant-scoped lists.
 *
 * 1. Apply on your test DB: migrations through **022** (`deno task apply-clinical-option-c-migrations`) — see `docs/runbooks/neon-clinical-option-c-migrations.md`
 * 2. Run: `cd backend && deno task test-backend-phase3`
 *
 * These tests are **ignored** in the default `deno task test-backend` run until
 * `RUN_PHASE3_CLINICAL_TESTS=1` is set (the task above does that).
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { TestDb } from "../utils/testDb.ts";
import { TestServer } from "../utils/testServer.ts";

const PORT = 8004;
const testServer = new TestServer(PORT);
const testDb = new TestDb();
const runSeed = Date.now() % 200;
let requestCounter = 1;

let doctorEmail = "";
let doctorPassword = "";
let doctorId = "";
let doctorToken = "";
let patientId = "";
let doctorTenantId = "";
let doctorMembershipId = "";
let otherTenantId = "";
let patientEmail = "";

const RUN_PHASE3 = Deno.env.get("RUN_PHASE3_CLINICAL_TESTS") === "1";

function clinicalTest(
  name: string,
  fn: (t: Deno.TestContext) => void | Promise<void>,
) {
  if (!RUN_PHASE3) {
    Deno.test.ignore(
      `${name} (skipped: apply migration_020, then deno task test-backend-phase3)`,
      () => {},
    );
    return;
  }
  Deno.test({ name, sanitizeResources: false, sanitizeOps: false }, fn);
}

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

async function doctorContextJson(
  method: "POST" | "PUT" | "PATCH",
  path: string,
  body: Record<string, unknown> | undefined,
  token: string,
  tenantId: string,
  membershipId: string,
) {
  const requestIp = `10.21.${runSeed}.${(requestCounter++ % 200) + 1}`;
  const res = await fetch(`${testServer.getBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Mediloop-Tenant-Id": tenantId,
      "X-Mediloop-Membership-Id": membershipId,
      "X-Forwarded-For": requestIp,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function patientBearerJson(
  method: "PATCH",
  path: string,
  body: Record<string, unknown>,
  token: string,
) {
  const requestIp = `10.21.${runSeed}.${(requestCounter++ % 200) + 1}`;
  const res = await fetch(`${testServer.getBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Forwarded-For": requestIp,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function getPrescriptions(
  token: string,
  tenantId: string,
  membershipId: string,
) {
  const requestIp = `10.21.${runSeed}.${(requestCounter++ % 200) + 1}`;
  const res = await fetch(`${testServer.getBaseUrl()}/api/prescriptions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Forwarded-For": requestIp,
      "X-Mediloop-Tenant-Id": tenantId,
      "X-Mediloop-Membership-Id": membershipId,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

clinicalTest("Phase 3 setup - DB + test server", async () => {
  await testDb.connect();
  await testServer.start();
});

clinicalTest("Phase 3 - attribution columns exist (migration 020)", async () => {
  const rows = await testDb.query<{ key: string; exists: boolean }>(
    `SELECT 'prescriptions.professional_tenant_id' AS key, EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='prescriptions'
         AND column_name='professional_tenant_id'
     ) AS exists
     UNION ALL
     SELECT 'prescriptions.created_by_membership_id' AS key, EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='prescriptions'
         AND column_name='created_by_membership_id'
     ) AS exists
     UNION ALL
     SELECT 'teleconsultations.professional_tenant_id' AS key, EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='teleconsultations'
         AND column_name='professional_tenant_id'
     ) AS exists`,
  );

  for (const r of rows) {
    assertEquals(
      r.exists,
      true,
      `Apply migration_020_option_c_phase3_clinical_attribution.sql — missing: ${r.key}`,
    );
  }
});

clinicalTest("Phase 3 - teleconsultation_status includes confirmed (migration 021)", async () => {
  const rows = await testDb.query<{ has_label: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
       JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = 'public' AND t.typname = 'teleconsultation_status'
         AND e.enumlabel = 'confirmed'
     ) AS has_label`,
  );
  assertEquals(
    rows[0]?.has_label,
    true,
    "Apply migration_021_teleconsultation_status_confirmed.sql (adds enum label on legacy DBs)",
  );
});

clinicalTest(
  "GET /api/clinical/platform-stats — public 200 and numeric counts (needs migration 022)",
  async () => {
    const res = await fetch(
      `${testServer.getBaseUrl()}/api/clinical/platform-stats`,
      { method: "GET" },
    );
    assertEquals(res.status, 200);
    const data = (await res.json()) as Record<string, unknown>;
    const keys = [
      "prescriptions_count",
      "teleconsultations_count",
      "connections_count",
      "orders_count",
      "pharmacies_count",
      "doctors_count",
    ] as const;
    for (const k of keys) {
      assert(
        typeof data[k] === "number" && (data[k] as number) >= 0,
        `expected non-negative number for ${k}, got ${JSON.stringify(data[k])}`,
      );
    }
  },
);

clinicalTest("Phase 3 - register doctor + patient, tenant scope on prescriptions", async () => {
  const ts = Date.now();
  doctorEmail = `clinical-doc-${ts}@example.com`;
  doctorPassword = "ClinicalPhase3Test!@#";
  patientEmail = `clinical-pat-${ts}@example.com`;
  const patientPassword = "ClinicalPhase3Test!@#";

  const regDoc = await postJson("/api/auth/register", {
    email: doctorEmail,
    password: doctorPassword,
    fullName: "Clinical Test Doctor",
    role: "doctor",
  });
  assertEquals(regDoc.res.status, 201);

  const tokDoc = await testDb.getVerificationToken(doctorEmail);
  assertExists(tokDoc);
  const verifyDoc = await fetch(
    `${testServer.getBaseUrl()}/api/auth/verify-email?token=${encodeURIComponent(tokDoc!)}`,
  );
  assertEquals(verifyDoc.status, 200);

  const loginDoc = await postJson("/api/auth/login", {
    email: doctorEmail,
    password: doctorPassword,
  });
  assertEquals(loginDoc.res.status, 200);
  doctorToken = String(loginDoc.data.access_token || "");
  doctorId = String(loginDoc.data.user?.id || "");
  assert(doctorToken.length > 20 && doctorId.length > 0);

  const regPat = await postJson("/api/auth/register", {
    email: patientEmail,
    password: patientPassword,
    fullName: "Clinical Test Patient",
    role: "patient",
  });
  assertEquals(regPat.res.status, 201);
  const tokPat = await testDb.getVerificationToken(patientEmail);
  assertExists(tokPat);
  const verifyPat = await fetch(
    `${testServer.getBaseUrl()}/api/auth/verify-email?token=${encodeURIComponent(tokPat!)}`,
  );
  assertEquals(verifyPat.status, 200);
  const patRow = await testDb.query<{ id: string }>(
    `SELECT id FROM auth.users WHERE email = $1`,
    [patientEmail],
  );
  patientId = patRow[0].id;

  const primary = await testDb.query<{ tenant_id: string; id: string }>(
    `SELECT tenant_id, id FROM public.user_tenants
     WHERE user_id = $1::uuid AND is_primary = true
     LIMIT 1`,
    [doctorId],
  );
  doctorTenantId = primary[0].tenant_id;
  doctorMembershipId = primary[0].id;

  const otherT = await testDb.query<{ id: string }>(
    `INSERT INTO public.tenants (name, schema, domain, tenant_type, is_active)
     VALUES ($1, $2, $3, 'clinic', true) RETURNING id`,
    [`Other clinic ${ts}`, `tenant_other_${ts}`, `other-${ts}.test`],
  );
  otherTenantId = otherT[0].id;

  await testDb.execute(
    `INSERT INTO public.prescriptions
      (doctor_id, patient_id, medication_name, dosage, frequency, duration, professional_tenant_id, created_by_membership_id)
     VALUES ($1::uuid, $2::uuid, 'Med-A', '5mg', 'qd', '30d', NULL, NULL)`,
    [doctorId, patientId],
  );

  await testDb.execute(
    `INSERT INTO public.prescriptions
      (doctor_id, patient_id, medication_name, dosage, frequency, duration, professional_tenant_id, created_by_membership_id)
     VALUES ($1::uuid, $2::uuid, 'Med-B', '10mg', 'bid', '14d', $3::uuid, $4::uuid)`,
    [doctorId, patientId, doctorTenantId, doctorMembershipId],
  );

  await testDb.execute(
    `INSERT INTO public.prescriptions
      (doctor_id, patient_id, medication_name, dosage, frequency, duration, professional_tenant_id, created_by_membership_id)
     VALUES ($1::uuid, $2::uuid, 'Med-C', '20mg', 'qd', '7d', $3::uuid, NULL)`,
    [doctorId, patientId, otherTenantId],
  );

  const list = await getPrescriptions(
    doctorToken,
    doctorTenantId,
    doctorMembershipId,
  );
  assertEquals(list.res.status, 200);
  const prescriptions = (list.data as { prescriptions?: unknown[] })
    .prescriptions;
  assertExists(prescriptions);
  assertEquals(
    prescriptions!.length,
    1,
    "Phase 4: only attributed rows in this workspace (legacy Med-A hidden)",
  );

  const names = (prescriptions as { medication_name: string }[]).map((p) =>
    p.medication_name
  ).sort();
  assertEquals(names, ["Med-B"]);

  const legacyRxRows = await testDb.query<{ id: string }>(
    `SELECT id FROM public.prescriptions
     WHERE doctor_id = $1::uuid AND patient_id = $2::uuid AND medication_name = 'Med-A'
     LIMIT 1`,
    [doctorId, patientId],
  );
  assertExists(legacyRxRows[0]);
  const putLegacy = await doctorContextJson(
    "PUT",
    `/api/prescriptions/${legacyRxRows[0].id}`,
    { dosage: "1mg" },
    doctorToken,
    doctorTenantId,
    doctorMembershipId,
  );
  assertEquals(putLegacy.res.status, 409);
  assertEquals(
    (putLegacy.data as { error?: string }).error,
    "legacy_row_not_mutable",
  );

  const loginPatApi = await postJson("/api/auth/login", {
    email: patientEmail,
    password: patientPassword,
  });
  assertEquals(loginPatApi.res.status, 200);
  const patientToken = String(loginPatApi.data.access_token || "");
  assert(patientToken.length > 20);

  const createRx = await doctorContextJson(
    "POST",
    "/api/prescriptions",
    {
      patient_id: patientId,
      medication_name: "Med-API",
      dosage: "2mg",
      frequency: "qd",
      duration: "10d",
      status: "active",
    },
    doctorToken,
    doctorTenantId,
    doctorMembershipId,
  );
  assertEquals(createRx.res.status, 201);
  const rx = (createRx.data as { prescription?: Record<string, unknown> })
    .prescription;
  assertExists(rx);
  assertEquals(String(rx!.professional_tenant_id), doctorTenantId);
  assertEquals(String(rx!.created_by_membership_id), doctorMembershipId);
  const rxId = String(rx!.id);

  const putRx = await doctorContextJson(
    "PUT",
    `/api/prescriptions/${rxId}`,
    { dosage: "4mg" },
    doctorToken,
    doctorTenantId,
    doctorMembershipId,
  );
  assertEquals(putRx.res.status, 200);
  const rxUpdated = (putRx.data as { prescription?: { dosage?: string } })
    .prescription;
  assertEquals(rxUpdated?.dosage, "4mg");

  const t0 = Date.now() + 60 * 60 * 1000;
  const t1 = t0 + 60 * 60 * 1000;
  const createTc = await doctorContextJson(
    "POST",
    "/api/teleconsultations",
    {
      patient_id: patientId,
      start_time: new Date(t0).toISOString(),
      end_time: new Date(t1).toISOString(),
      status: "pending",
    },
    doctorToken,
    doctorTenantId,
    doctorMembershipId,
  );
  assertEquals(createTc.res.status, 201);
  const tc = (createTc.data as { consultation?: Record<string, unknown> })
    .consultation;
  assertExists(tc);
  assertEquals(String(tc!.professional_tenant_id), doctorTenantId);
  assertEquals(String(tc!.created_by_membership_id), doctorMembershipId);
  const tcId = String(tc!.id);

  const patchTc = await doctorContextJson(
    "PATCH",
    `/api/teleconsultations/${tcId}`,
    { status: "confirmed" },
    doctorToken,
    doctorTenantId,
    doctorMembershipId,
  );
  assertEquals(patchTc.res.status, 200);
  const tc2 = (patchTc.data as { consultation?: { status?: string } })
    .consultation;
  assertEquals(tc2?.status, "confirmed");

  const createDpc = await doctorContextJson(
    "POST",
    "/api/clinical/doctor-patient-connections",
    { patient_id: patientId },
    doctorToken,
    doctorTenantId,
    doctorMembershipId,
  );
  assertEquals(createDpc.res.status, 201);
  const conn = (createDpc.data as { connection?: Record<string, unknown> })
    .connection;
  assertExists(conn);
  assertEquals(String(conn!.professional_tenant_id), doctorTenantId);
  assertEquals(String(conn!.created_by_membership_id), doctorMembershipId);
  const connId = String(conn!.id);

  const patchDpc = await patientBearerJson(
    "PATCH",
    `/api/clinical/doctor-patient-connections/${connId}`,
    { status: "accepted" },
    patientToken,
  );
  assertEquals(patchDpc.res.status, 200);
  const conn2 = (patchDpc.data as { connection?: { status?: string } })
    .connection;
  assertEquals(conn2?.status, "accepted");
});

clinicalTest("Phase 3 teardown", async () => {
  if (doctorId && patientId) {
    await testDb.execute(
      `DELETE FROM public.teleconsultations WHERE doctor_id = $1::uuid OR patient_id = $2::uuid`,
      [doctorId, patientId],
    );
    await testDb.execute(
      `DELETE FROM public.doctor_patient_connections WHERE doctor_id = $1::uuid OR patient_id = $2::uuid`,
      [doctorId, patientId],
    );
    await testDb.execute(
      `DELETE FROM public.prescriptions WHERE doctor_id = $1::uuid`,
      [doctorId],
    );
  }
  if (otherTenantId) {
    await testDb.execute(`DELETE FROM public.tenants WHERE id = $1::uuid`, [
      otherTenantId,
    ]);
  }
  if (doctorEmail) await testDb.deleteTestUser(doctorEmail);
  if (patientEmail) {
    try {
      await testDb.deleteTestUser(patientEmail);
    } catch {
      /* ignore */
    }
  }
  await testServer.stop();
  await testDb.close();
});
