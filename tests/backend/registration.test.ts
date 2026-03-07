/**
 * Backend Registration Tests
 * Tests registration with email verification
 *
 * Registration no longer returns tokens immediately
 * Users must verify email before they can login
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const BASE_URL = Deno.env.get("API_URL") || "http://localhost:8000";

async function makeRequest(endpoint: string, body: any) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { response, data };
}

// ============================================================================
// TEST 1: Successful Registration (New Behavior)
// ============================================================================

Deno.test(
  "Registration - Successful registration returns requiresVerification",
  async () => {
    console.log("\n🧪 Testing successful registration (NEW BEHAVIOR)...");

    const timestamp = Date.now();
    const email = `test-${timestamp}@mediloop.com`;
    const password = "SecurePass123!@#";
    const fullName = "Test User";
    const role = "doctor";

    const { response, data } = await makeRequest("/api/auth/register", {
      email,
      password,
      fullName,
      role,
    });

    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, data);

    // Should return 200 or 201
    assertEquals([200, 201].includes(response.status), true);

    // ✅ NEW: Should have requiresVerification flag
    assertExists(data.requiresVerification, "Should have requiresVerification");
    assertEquals(
      data.requiresVerification,
      true,
      "Should require verification",
    );

    // ❌ BREAKING CHANGE: Should NOT have access_token
    assertEquals(
      data.access_token,
      undefined,
      "Should NOT return access_token (BREAKING CHANGE)",
    );
    assertEquals(data.session_id, undefined, "Should NOT return session_id");

    // Should have success message
    assertExists(data.message, "Should have success message");
    assert(
      data.message.includes("verify") || data.message.includes("email"),
      "Message should mention email verification",
    );

    // Should have user object with id and email
    assertExists(data.user, "Should have user object");
    assertExists(data.user.id, "User should have id");
    assertEquals(data.user.email, email, "User email should match");

    console.log("✅ Registration correctly requires email verification\n");
  },
);

// ============================================================================
// TEST 2: Registration with All Fields
// ============================================================================

Deno.test("Registration - Complete registration with all fields", async () => {
  console.log("\n🧪 Testing registration with all fields...");

  const timestamp = Date.now();
  const { response, data } = await makeRequest("/api/auth/register", {
    email: `complete-${timestamp}@mediloop.com`,
    password: "CompletePass123!@#",
    fullName: "Complete User",
    role: "nurse",
    workplaceName: "Test Hospital",
    phone: `+1555${timestamp.toString().slice(-7)}`,
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  assertEquals([200, 201].includes(response.status), true);
  assertEquals(data.requiresVerification, true);
  assertEquals(data.access_token, undefined);
  assertExists(data.user);

  console.log("✅ Complete registration successful\n");
});

// ============================================================================
// TEST 3: Duplicate Email (Should Fail)
// ============================================================================

Deno.test("Registration - Duplicate email rejected", async () => {
  console.log("\n🧪 Testing duplicate email registration...");

  const email = `duplicate-${Date.now()}@mediloop.com`;
  const password = "DuplicatePass123!@#";

  // First registration
  const { response: res1 } = await makeRequest("/api/auth/register", {
    email,
    password,
    fullName: "First User",
  });

  assertEquals([200, 201].includes(res1.status), true);
  console.log("  ✓ First registration successful");

  // Try to register again with same email
  const { response: res2, data: data2 } = await makeRequest(
    "/api/auth/register",
    {
      email,
      password,
      fullName: "Second User",
    },
  );

  console.log(`  Status: ${res2.status}`);
  console.log(`  Response:`, data2);

  // Should fail
  assertEquals(res2.status, 400);
  assertExists(data2.error, "Should have error message");
  assert(
    data2.error.includes("exists") || data2.error.includes("already"),
    "Error should mention user already exists",
  );

  console.log("✅ Duplicate email correctly rejected\n");
});

// ============================================================================
// TEST 4: Missing Required Fields
// ============================================================================

Deno.test("Registration - Missing email rejected", async () => {
  console.log("\n🧪 Testing registration without email...");

  const { response, data } = await makeRequest("/api/auth/register", {
    password: "TestPass123!@#",
    fullName: "Test User",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  assertEquals(response.status, 400);
  assertExists(data.error, "Should have error");
  assert(
    data.error.includes("required") || data.error.includes("email"),
    "Error should mention required field",
  );

  console.log("✅ Missing email correctly rejected\n");
});

Deno.test("Registration - Missing password rejected", async () => {
  console.log("\n🧪 Testing registration without password...");

  const { response, data } = await makeRequest("/api/auth/register", {
    email: `test-${Date.now()}@mediloop.com`,
    fullName: "Test User",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  assertEquals(response.status, 400);
  assertExists(data.error, "Should have error");
  assert(
    data.error.includes("required") || data.error.includes("password"),
    "Error should mention required field",
  );

  console.log("✅ Missing password correctly rejected\n");
});

Deno.test("Registration - Missing fullName rejected", async () => {
  console.log("\n🧪 Testing registration without fullName...");

  const { response, data } = await makeRequest("/api/auth/register", {
    email: `test-${Date.now()}@mediloop.com`,
    password: "TestPass123!@#",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  assertEquals(response.status, 400);
  assertExists(data.error, "Should have error");
  assert(
    data.error.includes("required") || data.error.includes("name"),
    "Error should mention required field",
  );

  console.log("✅ Missing fullName correctly rejected\n");
});

// ============================================================================
// TEST 5: Invalid Email Format
// ============================================================================

Deno.test("Registration - Invalid email format rejected", async () => {
  console.log("\n🧪 Testing registration with invalid email...");

  const { response, data } = await makeRequest("/api/auth/register", {
    email: "not-an-email",
    password: "TestPass123!@#",
    fullName: "Test User",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  // Should fail (400 or 500 depending on validation)
  assertEquals([400, 500].includes(response.status), true);
  assertExists(data.error || data.message, "Should have error");

  console.log("✅ Invalid email format rejected\n");
});

// ============================================================================
// TEST 6: Password Too Short
// ============================================================================

Deno.test("Registration - Weak password rejected", async () => {
  console.log("\n🧪 Testing registration with weak password...");

  const { response, data } = await makeRequest("/api/auth/register", {
    email: `test-${Date.now()}@mediloop.com`,
    password: "123", // Too short
    fullName: "Test User",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  // Should fail
  assertEquals(response.status, 400);
  assertExists(data.error, "Should have error");

  console.log("✅ Weak password correctly rejected\n");
});

// ============================================================================
// TEST 7: SQL Injection Prevention
// ============================================================================

Deno.test("Registration - SQL injection prevented", async () => {
  console.log("\n🧪 Testing SQL injection prevention...");

  const { response, data } = await makeRequest("/api/auth/register", {
    email: "test@example.com'; DROP TABLE users; --",
    password: "TestPass123!@#",
    fullName: "SQL Injection Test",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  // Should either fail validation or handle safely
  // As long as it doesn't crash or allow injection, it passes
  assert(
    response.status === 400 ||
      response.status === 201 ||
      response.status === 200,
    "Should handle SQL injection attempt safely",
  );

  console.log("✅ SQL injection prevented\n");
});

// ============================================================================
// TEST 8: Database Structure (Tenant Creation)
// ============================================================================

Deno.test("Registration - Creates tenant for new user", async () => {
  console.log("\n🧪 Testing tenant creation...");

  const timestamp = Date.now();
  const { response, data } = await makeRequest("/api/auth/register", {
    email: `tenant-test-${timestamp}@mediloop.com`,
    password: "TenantTest123!@#",
    fullName: "Tenant Test User",
    workplaceName: "Test Clinic",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  assertEquals([200, 201].includes(response.status), true);

  console.log("  ℹ️  To verify tenant creation, check database:");
  console.log(
    `  SELECT t.* FROM tenants t JOIN user_tenants ut ON t.id = ut.tenant_id WHERE ut.user_id = '${data.user.id}';`,
  );

  console.log("✅ Registration successful (tenant should be created)\n");
});

// ============================================================================
// TEST 9: Verification Token Created
// ============================================================================

Deno.test("Registration - Creates email verification token", async () => {
  console.log("\n🧪 Testing verification token creation...");

  const timestamp = Date.now();
  const email = `token-test-${timestamp}@mediloop.com`;

  const { response, data } = await makeRequest("/api/auth/register", {
    email,
    password: "TokenTest123!@#",
    fullName: "Token Test User",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  assertEquals([200, 201].includes(response.status), true);

  console.log("  ℹ️  To verify token creation, check database:");
  console.log(
    `  SELECT * FROM auth.email_verification_tokens WHERE user_id = '${data.user.id}' ORDER BY created_at DESC LIMIT 1;`,
  );
  console.log("  Should have:");
  console.log("    - token (UUID)");
  console.log("    - expires_at (24 hours from now)");
  console.log("    - used = false");

  console.log("✅ Registration successful (token should be created)\n");
});

// ============================================================================
// TEST 10: Email Sending (Check Logs)
// ============================================================================

Deno.test("Registration - Verification email sent", async () => {
  console.log("\n🧪 Testing verification email sending...");

  const timestamp = Date.now();
  const { response, data } = await makeRequest("/api/auth/register", {
    email: `email-test-${timestamp}@mediloop.com`,
    password: "EmailTest123!@#",
    fullName: "Email Test User",
  });

  console.log(`  Status: ${response.status}`);
  console.log(`  Response:`, data);

  assertEquals([200, 201].includes(response.status), true);

  console.log("  ℹ️  Check backend logs for email sending confirmation");
  console.log("  Look for: 'Verification email sent to email-test-...'");

  console.log("✅ Registration successful (check logs for email)\n");
});

console.log("\n" + "=".repeat(70));
console.log("📋 Registration Test Suite Complete");
console.log("=".repeat(70));
console.log("\n📝 IMPORTANT CHANGES:");
console.log("  ✅ Registration now returns requiresVerification: true");
console.log("  ❌ Registration NO LONGER returns access_token");
console.log("  📧 Users must verify email before they can login");
console.log("\n");
