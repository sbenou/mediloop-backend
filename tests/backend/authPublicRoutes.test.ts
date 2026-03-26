/**
 * Public auth-related HTTP routes (no Bearer required):
 * - /api/oauth/* initiation and LuxTrust placeholder
 * - /api/luxtrust/* sandbox JSON API
 *
 * Uses embedded test server on port 8002 (avoids clash with emailVerification on 8001).
 *
 * Run from repo root:
 *   deno test --config backend/deno.json --allow-net --allow-env --allow-read --allow-run --unstable-kv tests/backend/authPublicRoutes.test.ts
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { TestServer } from "../utils/testServer.ts";

const PORT = 8002;
const testServer = new TestServer(PORT);

const pubTest = (
  name: string,
  fn: (t: Deno.TestContext) => void | Promise<void>,
) =>
  Deno.test({ name, sanitizeResources: false, sanitizeOps: false }, fn);

pubTest("Auth public routes - setup: start test server", async () => {
  await testServer.start();
});

pubTest("Auth public routes - GET /api/oauth/google redirects to Google", async () => {
  const res = await fetch(`${testServer.getBaseUrl()}/api/oauth/google`, {
    method: "GET",
    redirect: "manual",
  });
  assertEquals(res.status, 302);
  const loc = res.headers.get("location");
  assertExists(loc);
  assert(
    loc.includes("accounts.google.com") && loc.includes("oauth2"),
    `Expected Google OAuth URL, got: ${loc}`,
  );
  await res.body?.cancel();
});

pubTest("Auth public routes - GET /api/oauth/franceconnect redirects to FranceConnect", async () => {
  const res = await fetch(`${testServer.getBaseUrl()}/api/oauth/franceconnect`, {
    method: "GET",
    redirect: "manual",
  });
  assertEquals(res.status, 302);
  const loc = res.headers.get("location");
  assertExists(loc);
  assert(
    loc.includes("franceconnect") || loc.includes("fcp."),
    `Expected FranceConnect authorize URL, got: ${loc}`,
  );
  await res.body?.cancel();
});

pubTest("Auth public routes - GET /api/oauth/luxtrust returns 501 JSON", async () => {
  const res = await fetch(`${testServer.getBaseUrl()}/api/oauth/luxtrust`, {
    method: "GET",
  });
  assertEquals(res.status, 501);
  const data = await res.json();
  assertExists(data.error);
});

pubTest("Auth public routes - POST /api/luxtrust/auth returns success JSON", async () => {
  const res = await fetch(`${testServer.getBaseUrl()}/api/luxtrust/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "auth" }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.success, true);
  assertExists(data.sessionId);
  assertExists(data.verificationId);
  assertExists(data.profile);
});

pubTest("Auth public routes - POST /api/luxtrust/verify-id rejects bad format", async () => {
  const res = await fetch(`${testServer.getBaseUrl()}/api/luxtrust/verify-id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ luxtrustId: "not-valid" }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.success, false);
  assertEquals(data.status, "failed");
});

pubTest("Auth public routes - POST /api/luxtrust/verify-id accepts test pattern", async () => {
  const res = await fetch(`${testServer.getBaseUrl()}/api/luxtrust/verify-id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ luxtrustId: "TEST-LUX-ID-123456" }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assert(typeof data.success === "boolean");
  assertExists(data.sessionId);
});

pubTest("Auth public routes - POST /api/luxtrust/location/detect", async () => {
  const res = await fetch(`${testServer.getBaseUrl()}/api/luxtrust/location/detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ countryCode: "LU" }),
  });
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.success, true);
  assertEquals(data.luxtrustAvailable, true);
});

pubTest("Auth public routes - teardown: stop test server", async () => {
  await testServer.stop();
});
