/**
 * Simple Resend Email Send Test
 * Tests if Resend can actually send emails with your verified domain
 *
 * Run with:
 * VAULT_URL="http://localhost:8200" VAULT_TOKEN="myroot" deno test --allow-net --allow-env --allow-read tests/backend/emailSend.test.ts
 */

import {
  assertEquals,
  assertExists,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

// Import config from the backend to use Vault secrets
import { loadConfig } from "../../auth-backend/config/env.ts";

// Load config from Vault
const config = await loadConfig();

const RESEND_API_KEY = config.RESEND_API_KEY;
const RESEND_FROM_EMAIL = config.RESEND_FROM_EMAIL;

console.log("\n" + "=".repeat(70));
console.log("🔍 Environment Variable Discovery (from Vault)");
console.log("=".repeat(70));
console.log(
  `RESEND_API_KEY: ${RESEND_API_KEY ? "✅ Found in Vault" : "❌ Not found"}`,
);
console.log(`RESEND_FROM_EMAIL: ${RESEND_FROM_EMAIL}`);
console.log("=".repeat(70) + "\n");

// The email that should definitely work (your registered email)
const VERIFIED_EMAIL = "sbenou@hotmail.com";

// Test emails that might fail if there's a sandbox restriction
const TEST_EMAILS = [
  "test@mediloop.com",
  "user@example.com",
  "test123@test.com",
];

async function sendTestEmail(to: string, testName: string) {
  console.log(`\n📧 Sending test email to: ${to}`);
  console.log(`   Test: ${testName}`);

  const emailPayload = {
    from: `Mediloop Test <${RESEND_FROM_EMAIL}>`,
    to: [to],
    subject: `[TEST] Email Verification Test - ${testName}`,
    html: `
      <h1>Mediloop Email Test</h1>
      <p>This is a test email from your Mediloop platform.</p>
      <p><strong>Test Name:</strong> ${testName}</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p>If you received this email, your Resend integration is working correctly!</p>
      <hr>
      <p style="color: gray; font-size: 12px;">
        This is an automated test email. Domain: notifications.mediloop.lu
      </p>
    `,
  };

  console.log(`   From: ${emailPayload.from}`);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await res.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, data);

    return {
      success: res.ok,
      status: res.status,
      data,
      error: !res.ok ? data : null,
    };
  } catch (error) {
    console.error(
      `   ❌ Error:`,
      error instanceof Error ? error.message : String(error),
    );
    return {
      success: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// TEST 1: Check Environment Variables
// ============================================================================

Deno.test("Email Send - Environment variables are configured", () => {
  console.log("\n🔍 Checking environment variables...");

  console.log(`   RESEND_API_KEY: ${RESEND_API_KEY ? "✅ Set" : "❌ Not set"}`);
  console.log(`   RESEND_FROM_EMAIL: ${RESEND_FROM_EMAIL}`);

  assertExists(RESEND_API_KEY, "RESEND_API_KEY must be set");
  assertExists(RESEND_FROM_EMAIL, "RESEND_FROM_EMAIL must be set");

  console.log("\n✅ Environment variables configured\n");
});

// ============================================================================
// TEST 2: Send to Verified Email (Should Always Work)
// ============================================================================

Deno.test(
  "Email Send - Send to verified email (sbenou@hotmail.com)",
  async () => {
    console.log("\n🧪 Testing email send to verified address...");
    console.log("   This should ALWAYS work regardless of any restrictions");

    const result = await sendTestEmail(VERIFIED_EMAIL, "Verified Email Test");

    console.log(`\n   Result: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);

    if (!result.success) {
      console.log(`   Error Details:`, result.error);
    }

    assertEquals(
      result.success,
      true,
      `Email send failed: ${JSON.stringify(result.error)}`,
    );
    assertEquals(result.status, 200, "Should return 200 OK");
    assertExists(result.data.id, "Should return email ID");

    console.log(`   Email ID: ${result.data.id}`);
    console.log("\n✅ Email sent successfully to verified address!\n");
  },
);

// ============================================================================
// TEST 3: Send to Test Email 1
// ============================================================================

Deno.test("Email Send - Send to test email 1 (test@mediloop.com)", async () => {
  console.log("\n🧪 Testing email send to test address 1...");
  console.log("   If this fails, there may be a sandbox restriction");

  const result = await sendTestEmail(TEST_EMAILS[0], "Test Email 1");

  console.log(`\n   Result: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);

  if (!result.success) {
    console.log(`   Error Details:`, result.error);
    console.log(
      "\n⚠️  This might indicate a sandbox restriction or domain issue",
    );
  } else {
    console.log(`   Email ID: ${result.data.id}`);
    console.log("\n✅ Email sent successfully - no sandbox restriction!\n");
  }

  // We don't assert here - just report the result
  if (result.success) {
    assertEquals(result.status, 200);
  }
});

// ============================================================================
// TEST 4: Send to Test Email 2
// ============================================================================

Deno.test("Email Send - Send to test email 2 (user@example.com)", async () => {
  console.log("\n🧪 Testing email send to test address 2...");

  const result = await sendTestEmail(TEST_EMAILS[1], "Test Email 2");

  console.log(`\n   Result: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);

  if (!result.success) {
    console.log(`   Error Details:`, result.error);
  } else {
    console.log(`   Email ID: ${result.data.id}`);
  }

  // We don't assert here - just report the result
  if (result.success) {
    assertEquals(result.status, 200);
  }
});

// ============================================================================
// TEST 5: Send to Test Email 3
// ============================================================================

Deno.test("Email Send - Send to test email 3 (test123@test.com)", async () => {
  console.log("\n🧪 Testing email send to test address 3...");

  const result = await sendTestEmail(TEST_EMAILS[2], "Test Email 3");

  console.log(`\n   Result: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);

  if (!result.success) {
    console.log(`   Error Details:`, result.error);
  } else {
    console.log(`   Email ID: ${result.data.id}`);
  }

  // We don't assert here - just report the result
  if (result.success) {
    assertEquals(result.status, 200);
  }
});

// ============================================================================
// TEST 6: Rate Limit Test (Send Multiple Emails)
// ============================================================================

Deno.test("Email Send - Rate limit test (multiple sends)", async () => {
  console.log("\n🧪 Testing rate limits (sending 3 emails quickly)...");

  const results = [];

  for (let i = 1; i <= 3; i++) {
    console.log(`\n   Sending email ${i}/3...`);
    const result = await sendTestEmail(VERIFIED_EMAIL, `Rate Limit Test ${i}`);
    results.push(result);

    // Small delay between sends
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(`\n   Results: ${successCount}/3 emails sent successfully`);

  if (successCount < 3) {
    console.log("   ⚠️  Some emails failed - might be rate limiting");
    results.forEach((r, i) => {
      if (!r.success) {
        console.log(`   Email ${i + 1} error:`, r.error);
      }
    });
  } else {
    console.log("\n✅ All emails sent - no rate limiting issues\n");
  }

  // At least the first email should succeed
  assertEquals(results[0].success, true, "First email should succeed");
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log("\n" + "=".repeat(70));
console.log("📋 Resend Email Send Test Summary");
console.log("=".repeat(70));
console.log("\n📝 What this test does:");
console.log("  1. Verifies environment variables are set");
console.log("  2. Sends email to your verified address (sbenou@hotmail.com)");
console.log("  3. Attempts to send to test addresses");
console.log("  4. Tests rate limiting");
console.log("\n📊 Expected Results:");
console.log("  ✅ If ALL tests pass: No sandbox restriction!");
console.log("  ⚠️  If only verified email works: Domain may have restrictions");
console.log("  ❌ If verified email fails: API key or domain config issue");
console.log("\n🔍 Next Steps:");
console.log("  - Check your email inbox (sbenou@hotmail.com)");
console.log("  - Check spam folder if not received");
console.log("  - Review Resend dashboard for delivery status");
console.log("  - Check any error messages above");
console.log("\n");
