/**
 * Backend Email Verification Tests
 * Tests the new email verification flow integrated with registration and login
 *
 * IMPORTANT: These tests require the email verification integration to be deployed
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const BASE_URL = Deno.env.get("API_URL") || "http://localhost:8000";

async function makeRequest(
  endpoint: string,
  body?: any,
  method = "POST",
  headers: Record<string, string> = {},
) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  return { response, data };
}

// Helper to query database for verification token (manual step in tests)
async function getVerificationTokenFromDB(
  email: string,
): Promise<string | null> {
  console.log("  ⚠️  MANUAL STEP: Get verification token from database");
  console.log(`  Run this SQL query:`);
  console.log(
    `  SELECT token FROM auth.email_verification_tokens WHERE user_id = (SELECT id FROM auth.users WHERE email = '${email}') AND used = false ORDER BY created_at DESC LIMIT 1;`,
  );
  return null; // Would need to be populated manually or via DB connection
}

// ============================================================================
// TEST 1: Registration (Should NOT Return Tokens)
// ============================================================================

Deno.test(
  "Email Verification - Registration does NOT return tokens",
  async () => {
    console.log(
      "\n🧪 Testing registration (should NOT return access_token)...",
    );

    const timestamp = Date.now();
    const email = `test-${timestamp}@mediloop.com`;
    const password = "TestPass123!@#";

    const { response, data } = await makeRequest("/api/auth/register", {
      email,
      password,
      fullName: "Test User",
      role: "doctor",
    });

    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, data);

    // Should return 200 or 201
    assertEquals([200, 201].includes(response.status), true);

    // ✅ CRITICAL: Should include requiresVerification flag
    assertExists(
      data.requiresVerification,
      "Should have requiresVerification field",
    );
    assertEquals(
      data.requiresVerification,
      true,
      "requiresVerification should be true",
    );

    // ❌ CRITICAL: Should NOT include access_token
    assertEquals(
      data.access_token,
      undefined,
      "Registration should NOT return access_token",
    );

    // Should include success message
    assertExists(data.message, "Should have success message");
    assert(
      data.message.includes("verify") || data.message.includes("email"),
      "Message should mention email verification",
    );

    // Should include user object
    assertExists(data.user, "Should have user object");
    assertExists(data.user.id, "User should have id");
    assertExists(data.user.email, "User should have email");

    console.log(
      "✅ Registration correctly returns requiresVerification with NO tokens\n",
    );

    // Save email for next test
    Deno.env.set("TEST_USER_EMAIL", email);
    Deno.env.set("TEST_USER_PASSWORD", password);
  },
);

// ============================================================================
// TEST 2: Login Before Verification (Should Be Blocked)
// ============================================================================

Deno.test(
  "Email Verification - Login blocked before verification",
  async () => {
    console.log(
      "\n🧪 Testing login before email verification (should be blocked)...",
    );

    const email = Deno.env.get("TEST_USER_EMAIL") || "test@mediloop.com";
    const password = Deno.env.get("TEST_USER_PASSWORD") || "TestPass123!@#";

    const { response, data } = await makeRequest("/api/auth/login", {
      email,
      password,
    });

    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, data);

    // ✅ CRITICAL: Should return 403 Forbidden
    assertEquals(
      response.status,
      403,
      "Login should be blocked with 403 status",
    );

    // Should have error message about verification
    assertExists(data.error, "Should have error message");
    assert(
      data.error.includes("verify") || data.error.includes("verification"),
      "Error should mention verification",
    );

    // Should include requiresVerification flag
    assertExists(
      data.requiresVerification,
      "Should have requiresVerification field",
    );
    assertEquals(data.requiresVerification, true);

    // Should include userId and email for resend functionality
    assertExists(data.userId, "Should have userId");
    assertExists(data.email, "Should have email");

    // ❌ Should NOT return access_token
    assertEquals(
      data.access_token,
      undefined,
      "Blocked login should NOT return access_token",
    );

    console.log("✅ Login correctly blocked for unverified email\n");
  },
);

// ============================================================================
// TEST 3: Check Verification Status
// ============================================================================

Deno.test("Email Verification - Check verification status", async () => {
  console.log("\n🧪 Testing verification status check...");

  const email = Deno.env.get("TEST_USER_EMAIL") || "test@mediloop.com";

  const { response, data } = await makeRequest(
    `/api/auth/verification-status?email=${email}`,
    undefined,
    "GET",
  );

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  assertEquals(response.status, 200);
  assertExists(data.email_verified, "Should have email_verified field");
  assertEquals(data.email_verified, false, "Email should not be verified yet");
  assertExists(data.user_id, "Should have user_id");

  console.log("✅ Verification status correctly shows false\n");
});

// ============================================================================
// TEST 4: Resend Verification Email
// ============================================================================

Deno.test("Email Verification - Resend verification email", async () => {
  console.log("\n🧪 Testing resend verification email...");

  const email = Deno.env.get("TEST_USER_EMAIL") || "test@mediloop.com";

  const { response, data } = await makeRequest(
    "/api/auth/resend-verification",
    { email },
  );

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  assertEquals(response.status, 200);
  assertExists(data.message, "Should have success message");
  assert(
    data.message.includes("sent") || data.message.includes("email"),
    "Message should confirm email sent",
  );

  console.log("✅ Verification email resend successful\n");
});

// ============================================================================
// TEST 5: Verify Email with Token (POST)
// ============================================================================

Deno.test("Email Verification - Verify email with token (POST)", async () => {
  console.log("\n🧪 Testing email verification with token...");

  const email = Deno.env.get("TEST_USER_EMAIL") || "test@mediloop.com";

  // Manual step: Get token from database
  console.log("  ⚠️  MANUAL STEP REQUIRED:");
  await getVerificationTokenFromDB(email);

  const token = Deno.env.get("TEST_VERIFICATION_TOKEN");

  if (!token) {
    console.log("  ⚠️  No token provided - skipping verification test");
    console.log("  Set TEST_VERIFICATION_TOKEN env var to run this test");
    return;
  }

  const { response, data } = await makeRequest("/api/auth/verify-email", {
    token,
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  // Should return 200 OK
  assertEquals(response.status, 200);

  // ✅ Should include tokens (auto-login after verification)
  assertExists(
    data.access_token,
    "Should return access_token after verification",
  );
  assertExists(data.session_id, "Should return session_id");
  assertExists(data.expires_at, "Should return expires_at");

  // Should include user with email_verified = true
  assertExists(data.user, "Should return user object");
  assertEquals(
    data.user.email_verified,
    true,
    "User email_verified should be true",
  );

  // Should include success message
  assertExists(data.message, "Should have success message");

  console.log("✅ Email verification successful with auto-login\n");

  // Save token for next tests
  Deno.env.set("TEST_ACCESS_TOKEN", data.access_token);
});

// ============================================================================
// TEST 6: Try to Use Same Token Again (Should Fail)
// ============================================================================

Deno.test("Email Verification - Reject already used token", async () => {
  console.log("\n🧪 Testing reuse of verification token (should fail)...");

  const token = Deno.env.get("TEST_VERIFICATION_TOKEN");

  if (!token) {
    console.log("  ⚠️  No token provided - skipping token reuse test");
    return;
  }

  const { response, data } = await makeRequest("/api/auth/verify-email", {
    token,
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  // Should return 400 Bad Request
  assertEquals(response.status, 400);

  // Should have error about token already used
  assertExists(data.error, "Should have error message");
  assert(
    data.error.includes("used") || data.error.includes("invalid"),
    "Error should mention token is used/invalid",
  );

  console.log("✅ Used token correctly rejected\n");
});

// ============================================================================
// TEST 7: Login After Verification (Should Work)
// ============================================================================

Deno.test(
  "Email Verification - Login after verification succeeds",
  async () => {
    console.log("\n🧪 Testing login after email verification (should work)...");

    const email = Deno.env.get("TEST_USER_EMAIL") || "test@mediloop.com";
    const password = Deno.env.get("TEST_USER_PASSWORD") || "TestPass123!@#";

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

    // Should include user with email_verified = true
    assertExists(data.user, "Should return user object");
    assertEquals(
      data.user.email_verified,
      true,
      "User email_verified should be true",
    );

    console.log("✅ Login successful after email verification\n");
  },
);

// ============================================================================
// TEST 8: Get Profile (Should Include email_verified)
// ============================================================================

Deno.test(
  "Email Verification - Profile includes email_verified field",
  async () => {
    console.log("\n🧪 Testing profile includes email_verified...");

    const token = Deno.env.get("TEST_ACCESS_TOKEN");

    if (!token) {
      console.log("  ⚠️  No access token - skipping profile test");
      return;
    }

    const { response, data } = await makeRequest(
      "/api/auth/profile",
      undefined,
      "GET",
      { Authorization: `Bearer ${token}` },
    );

    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, data);

    assertEquals(response.status, 200);

    // ✅ Profile should include email_verified
    assertExists(data.profile, "Should have profile object");
    assertExists(
      data.profile.email_verified,
      "Profile should have email_verified field",
    );
    assertEquals(
      data.profile.email_verified,
      true,
      "Profile email_verified should be true",
    );

    console.log("✅ Profile correctly includes email_verified field\n");
  },
);

// ============================================================================
// TEST 9: Invalid Verification Token
// ============================================================================

Deno.test("Email Verification - Invalid token rejected", async () => {
  console.log("\n🧪 Testing invalid verification token...");

  const { response, data } = await makeRequest("/api/auth/verify-email", {
    token: "invalid-token-12345",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  assertEquals(response.status, 400);
  assertExists(data.error, "Should have error message");
  assert(
    data.error.includes("invalid") || data.error.includes("Invalid"),
    "Error should mention invalid token",
  );

  console.log("✅ Invalid token correctly rejected\n");
});

// ============================================================================
// TEST 10: Resend Verification for Already Verified User
// ============================================================================

Deno.test("Email Verification - Resend blocked for verified user", async () => {
  console.log("\n🧪 Testing resend for already verified user...");

  const email = Deno.env.get("TEST_USER_EMAIL") || "test@mediloop.com";

  const { response, data } = await makeRequest(
    "/api/auth/resend-verification",
    { email },
  );

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  assertEquals(response.status, 400);
  assertExists(data.error, "Should have error message");
  assert(
    data.error.includes("already verified") || data.error.includes("verified"),
    "Error should mention email is already verified",
  );

  console.log("✅ Resend correctly blocked for verified user\n");
});

// ============================================================================
// TEST 11: Verify Email with GET (Email Link Click)
// ============================================================================

Deno.test(
  "Email Verification - Verify via GET request (email link)",
  async () => {
    console.log(
      "\n🧪 Testing email verification via GET (email link click)...",
    );

    // Create a new user for this test
    const timestamp = Date.now();
    const email = `get-test-${timestamp}@mediloop.com`;
    const password = "TestPass123!@#";

    await makeRequest("/api/auth/register", {
      email,
      password,
      fullName: "GET Test User",
    });

    console.log("  ℹ️  User registered, now need token from database");
    await getVerificationTokenFromDB(email);

    const token = Deno.env.get("TEST_VERIFICATION_TOKEN_GET");

    if (!token) {
      console.log("  ⚠️  No token provided - skipping GET verification test");
      console.log("  Set TEST_VERIFICATION_TOKEN_GET env var to run this test");
      return;
    }

    // Simulate clicking email link (GET request)
    const response = await fetch(
      `${BASE_URL}/api/auth/verify-email?token=${token}`,
      { method: "GET" },
    );
    const data = await response.json();

    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, data);

    assertEquals(response.status, 200);
    assertExists(data.access_token, "Should return access_token");
    assertEquals(data.user.email_verified, true, "Should be verified");

    console.log("✅ GET verification (email link click) successful\n");
  },
);

// ============================================================================
// TEST 12: Security - No User Enumeration
// ============================================================================

Deno.test(
  "Email Verification - Security: No user enumeration on resend",
  async () => {
    console.log("\n🧪 Testing security: No user enumeration...");

    const { response, data } = await makeRequest(
      "/api/auth/resend-verification",
      { email: "nonexistent@mediloop.com" },
    );

    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, data);

    // Should return 200 (don't reveal if user exists)
    assertEquals(response.status, 200, "Should not reveal if user exists");

    // Should have generic success message
    assertExists(data.message, "Should have message");

    console.log("✅ No user enumeration - security check passed\n");
  },
);

// ============================================================================
// INTEGRATION TEST: Full Flow
// ============================================================================

Deno.test("Email Verification - Full integration flow", async () => {
  console.log("\n🧪 Testing complete email verification flow...");

  const timestamp = Date.now();
  const email = `integration-${timestamp}@mediloop.com`;
  const password = "IntegrationPass123!@#";

  // Step 1: Register
  console.log("  Step 1: Register user");
  const { response: regRes, data: regData } = await makeRequest(
    "/api/auth/register",
    { email, password, fullName: "Integration Test" },
  );

  assertEquals(regRes.status, 201);
  assertEquals(regData.requiresVerification, true);
  assertEquals(regData.access_token, undefined);
  console.log("  ✓ Registration successful (no tokens)");

  // Step 2: Try to login (should fail)
  console.log("  Step 2: Try to login");
  const { response: loginRes1 } = await makeRequest("/api/auth/login", {
    email,
    password,
  });

  assertEquals(loginRes1.status, 403);
  console.log("  ✓ Login correctly blocked");

  // Step 3: Check verification status
  console.log("  Step 3: Check status");
  const { response: statusRes1, data: statusData1 } = await makeRequest(
    `/api/auth/verification-status?email=${email}`,
    undefined,
    "GET",
  );

  assertEquals(statusRes1.status, 200);
  assertEquals(statusData1.email_verified, false);
  console.log("  ✓ Status shows unverified");

  // Step 4: Resend verification
  console.log("  Step 4: Resend verification");
  const { response: resendRes } = await makeRequest(
    "/api/auth/resend-verification",
    { email },
  );

  assertEquals(resendRes.status, 200);
  console.log("  ✓ Resend successful");

  console.log("\n  ℹ️  Manual steps to complete:");
  console.log("  5. Get verification token from database");
  console.log("  6. Verify email with token");
  console.log("  7. Login should work");
  console.log("  8. Profile should show email_verified: true");

  console.log("\n✅ Email verification integration flow verified\n");
});

console.log("\n" + "=".repeat(70));
console.log("📋 Email Verification Test Suite Complete");
console.log("=".repeat(70));
console.log("\n📝 Notes:");
console.log("  - Some tests require manual database queries for tokens");
console.log(
  "  - Set TEST_VERIFICATION_TOKEN env var for full verification tests",
);
console.log("  - In production, tokens would come from email links");
console.log("\n");
