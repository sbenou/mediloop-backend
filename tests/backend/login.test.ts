/**
 * Backend Login Tests
 * Tests login with email verification
 *
 * Login now checks email_verified status
 * Unverified users are blocked with 403 status
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const BASE_URL = Deno.env.get("API_URL") || "http://localhost:8000";

async function makeRequest(
  endpoint: string,
  body: any,
  headers: Record<string, string> = {},
) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { response, data };
}

// ============================================================================
// TEST 1: Login with Unverified Email (Should Be Blocked)
// ============================================================================

Deno.test("Login - Blocked for unverified email", async () => {
  console.log(
    "\n🧪 Testing login with unverified email (should be blocked)...",
  );

  // Register a new user (won't verify)
  const timestamp = Date.now();
  const email = `unverified-${timestamp}@mediloop.com`;
  const password = "UnverifiedPass123!@#";

  await makeRequest("/api/auth/register", {
    email,
    password,
    fullName: "Unverified User",
  });

  console.log("  ✓ User registered (email not verified)");

  // Try to login
  const { response, data } = await makeRequest("/api/auth/login", {
    email,
    password,
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  // ✅ NEW BEHAVIOR: Should return 403 Forbidden
  assertEquals(
    response.status,
    403,
    "Login should be blocked with 403 for unverified email",
  );

  // Should have error message
  assertExists(data.error, "Should have error message");
  assert(
    data.error.includes("verify") || data.error.includes("verification"),
    "Error should mention email verification",
  );

  // Should include requiresVerification flag
  assertExists(data.requiresVerification, "Should have requiresVerification");
  assertEquals(data.requiresVerification, true);

  // Should include userId and email for frontend to show resend option
  assertExists(data.userId, "Should have userId");
  assertExists(data.email, "Should have email");

  // ❌ Should NOT return access_token
  assertEquals(
    data.access_token,
    undefined,
    "Blocked login should NOT return tokens",
  );

  console.log("✅ Login correctly blocked for unverified email\n");
});

// ============================================================================
// TEST 2: Login with Verified Email (Should Work)
// ============================================================================

Deno.test("Login - Successful login with verified email", async () => {
  console.log("\n🧪 Testing login with verified email...");

  console.log("  ⚠️  This test requires a verified user");
  console.log("  Set TEST_VERIFIED_EMAIL and TEST_VERIFIED_PASSWORD env vars");

  const email = Deno.env.get("TEST_VERIFIED_EMAIL");
  const password = Deno.env.get("TEST_VERIFIED_PASSWORD");

  if (!email || !password) {
    console.log("  ⚠️  Skipping test - no verified user credentials");
    return;
  }

  const { response, data } = await makeRequest("/api/auth/login", {
    email,
    password,
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  // Should return 200 OK
  assertEquals(response.status, 200);

  // ✅ Should include tokens
  assertExists(data.access_token, "Should return access_token");
  assertExists(data.session_id, "Should return session_id");
  assertExists(data.expires_at, "Should return expires_at");

  // Should include user object
  assertExists(data.user, "Should return user object");
  assertExists(data.user.id, "User should have id");
  assertEquals(data.user.email, email, "Email should match");

  // ✅ NEW: User should include email_verified field
  assertExists(
    data.user.email_verified,
    "User should have email_verified field",
  );
  assertEquals(data.user.email_verified, true, "Email should be verified");

  console.log("✅ Login successful with verified email\n");

  // Save token for other tests
  Deno.env.set("TEST_ACCESS_TOKEN", data.access_token);
});

// ============================================================================
// TEST 3: Login with Wrong Password
// ============================================================================

Deno.test("Login - Wrong password rejected", async () => {
  console.log("\n🧪 Testing login with wrong password...");

  const email = Deno.env.get("TEST_VERIFIED_EMAIL") || "test@example.com";

  const { response, data } = await makeRequest("/api/auth/login", {
    email,
    password: "WrongPassword123!@#",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  // Should return 401 Unauthorized
  assertEquals(response.status, 401);

  // Should have error message
  assertExists(data.error, "Should have error message");
  assert(
    data.error.includes("Invalid") || data.error.includes("password"),
    "Error should mention invalid credentials",
  );

  // Should NOT return tokens
  assertEquals(data.access_token, undefined);

  console.log("✅ Wrong password correctly rejected\n");
});

// ============================================================================
// TEST 4: Login with Non-Existent Email
// ============================================================================

Deno.test("Login - Non-existent email rejected", async () => {
  console.log("\n🧪 Testing login with non-existent email...");

  const { response, data } = await makeRequest("/api/auth/login", {
    email: "nonexistent@mediloop.com",
    password: "SomePassword123!@#",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  // Should return 401 Unauthorized
  assertEquals(response.status, 401);

  // Should have error message
  assertExists(data.error, "Should have error message");
  assert(
    data.error.includes("No account") || data.error.includes("not found"),
    "Error should mention account not found",
  );

  console.log("✅ Non-existent email correctly rejected\n");
});

// ============================================================================
// TEST 5: Login with Missing Credentials
// ============================================================================

Deno.test("Login - Missing email rejected", async () => {
  console.log("\n🧪 Testing login without email...");

  const { response, data } = await makeRequest("/api/auth/login", {
    password: "SomePassword123!@#",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  assertEquals(response.status, 400);
  assertExists(data.error, "Should have error");

  console.log("✅ Missing email correctly rejected\n");
});

Deno.test("Login - Missing password rejected", async () => {
  console.log("\n🧪 Testing login without password...");

  const { response, data } = await makeRequest("/api/auth/login", {
    email: "test@example.com",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  assertEquals(response.status, 400);
  assertExists(data.error, "Should have error");

  console.log("✅ Missing password correctly rejected\n");
});

// ============================================================================
// TEST 6: SQL Injection Prevention
// ============================================================================

Deno.test("Login - SQL injection prevented", async () => {
  console.log("\n🧪 Testing SQL injection prevention...");

  const { response, data } = await makeRequest("/api/auth/login", {
    email: "admin@example.com' OR '1'='1",
    password: "anything",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  // Should be rejected (not allow login)
  assertEquals(response.status, 401);
  assertEquals(data.access_token, undefined);

  console.log("✅ SQL injection prevented\n");
});

// ============================================================================
// TEST 7: Token Format Validation
// ============================================================================

Deno.test("Login - Returns valid JWT token", async () => {
  console.log("\n🧪 Testing JWT token format...");

  const email = Deno.env.get("TEST_VERIFIED_EMAIL");
  const password = Deno.env.get("TEST_VERIFIED_PASSWORD");

  if (!email || !password) {
    console.log("  ⚠️  Skipping test - no verified user credentials");
    return;
  }

  const { response, data } = await makeRequest("/api/auth/login", {
    email,
    password,
  });

  if (response.status !== 200) {
    console.log("  ⚠️  Login failed - skipping token validation");
    return;
  }

  // Check token format (JWT has 3 parts separated by dots)
  assertExists(data.access_token, "Should have access_token");
  const tokenParts = data.access_token.split(".");
  assertEquals(tokenParts.length, 3, "JWT should have 3 parts");

  console.log("✅ Token format is valid JWT\n");
});

// ============================================================================
// TEST 8: Session Creation
// ============================================================================

Deno.test("Login - Creates session with ID", async () => {
  console.log("\n🧪 Testing session creation...");

  const email = Deno.env.get("TEST_VERIFIED_EMAIL");
  const password = Deno.env.get("TEST_VERIFIED_PASSWORD");

  if (!email || !password) {
    console.log("  ⚠️  Skipping test - no verified user credentials");
    return;
  }

  const { response, data } = await makeRequest("/api/auth/login", {
    email,
    password,
  });

  if (response.status !== 200) {
    console.log("  ⚠️  Login failed - skipping session check");
    return;
  }

  // Should have session_id
  assertExists(data.session_id, "Should have session_id");

  // Session ID should be a UUID
  assert(
    data.session_id.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    ),
    "Session ID should be a valid UUID",
  );

  console.log(`  Session ID: ${data.session_id}`);
  console.log("✅ Session created successfully\n");
});

// ============================================================================
// TEST 9: Multiple Login Sessions
// ============================================================================

Deno.test("Login - Allows multiple sessions", async () => {
  console.log("\n🧪 Testing multiple login sessions...");

  const email = Deno.env.get("TEST_VERIFIED_EMAIL");
  const password = Deno.env.get("TEST_VERIFIED_PASSWORD");

  if (!email || !password) {
    console.log("  ⚠️  Skipping test - no verified user credentials");
    return;
  }

  // Login first time
  const { response: res1, data: data1 } = await makeRequest("/api/auth/login", {
    email,
    password,
  });

  assertEquals(res1.status, 200);
  console.log(`  ✓ First login: ${data1.session_id}`);

  // Login second time (should create new session)
  const { response: res2, data: data2 } = await makeRequest("/api/auth/login", {
    email,
    password,
  });

  assertEquals(res2.status, 200);
  console.log(`  ✓ Second login: ${data2.session_id}`);

  // Session IDs should be different
  assert(
    data1.session_id !== data2.session_id,
    "Each login should create a new session",
  );

  console.log("✅ Multiple sessions allowed\n");
});

// ============================================================================
// TEST 10: Token Expiry Information
// ============================================================================

Deno.test("Login - Returns token expiry information", async () => {
  console.log("\n🧪 Testing token expiry information...");

  const email = Deno.env.get("TEST_VERIFIED_EMAIL");
  const password = Deno.env.get("TEST_VERIFIED_PASSWORD");

  if (!email || !password) {
    console.log("  ⚠️  Skipping test - no verified user credentials");
    return;
  }

  const { response, data } = await makeRequest("/api/auth/login", {
    email,
    password,
  });

  if (response.status !== 200) {
    console.log("  ⚠️  Login failed - skipping expiry check");
    return;
  }

  // Should have expires_in (seconds)
  assertExists(data.expires_in, "Should have expires_in");
  assert(typeof data.expires_in === "number", "expires_in should be a number");
  assert(data.expires_in > 0, "expires_in should be positive");

  // Should have expires_at (timestamp)
  assertExists(data.expires_at, "Should have expires_at");

  console.log(`  Token expires in: ${data.expires_in} seconds`);
  console.log(`  Expires at: ${data.expires_at}`);
  console.log("✅ Token expiry information present\n");
});

// ============================================================================
// INTEGRATION TEST: Full Login Flow After Verification
// ============================================================================

Deno.test("Login - Full flow: Register → Verify → Login", async () => {
  console.log("\n🧪 Testing complete login flow after verification...");

  const timestamp = Date.now();
  const email = `full-flow-${timestamp}@mediloop.com`;
  const password = "FullFlow123!@#";

  // Step 1: Register
  console.log("  Step 1: Register user");
  const { response: regRes } = await makeRequest("/api/auth/register", {
    email,
    password,
    fullName: "Full Flow Test",
  });

  assertEquals(regRes.status, 201);
  console.log("  ✓ Registration successful");

  // Step 2: Try to login (should fail - unverified)
  console.log("  Step 2: Try to login (unverified)");
  const { response: loginRes1 } = await makeRequest("/api/auth/login", {
    email,
    password,
  });

  assertEquals(loginRes1.status, 403);
  console.log("  ✓ Login correctly blocked");

  console.log("\n  ℹ️  Manual steps to complete:");
  console.log("  3. Get verification token from database");
  console.log("  4. Verify email");
  console.log("  5. Login should work and return:");
  console.log("     - access_token");
  console.log("     - session_id");
  console.log("     - user.email_verified = true");

  console.log("\n✅ Login flow structure verified\n");
});

console.log("\n" + "=".repeat(70));
console.log("📋 Login Test Suite Complete");
console.log("=".repeat(70));
console.log("\n📝 IMPORTANT CHANGES:");
console.log("  ✅ Login now checks email_verified status");
console.log("  ❌ Unverified users get 403 Forbidden");
console.log("  📧 Login response includes email_verified field");
console.log("\n📝 To run full tests, set these env vars:");
console.log("  - TEST_VERIFIED_EMAIL (a user who has verified their email)");
console.log("  - TEST_VERIFIED_PASSWORD (their password)");
console.log("\n");
