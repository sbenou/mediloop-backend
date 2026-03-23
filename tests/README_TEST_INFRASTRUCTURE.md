# 🧪 Test Infrastructure Guide

## Overview

This guide explains the test infrastructure for Mediloop backend, including automatic database token fetching and reusable test utilities.

---

## 🎯 What We've Built

### 1. **Database Test Utilities** (`/tests/utils/testDb.ts`)

Reusable TypeScript/Deno utilities for database operations during testing.

**Features:**
- ✅ Auto-connect to test database
- ✅ Fetch verification tokens from database
- ✅ Check email verification status
- ✅ Get password reset tokens (for future tests)
- ✅ Get invitation tokens (for future tests)
- ✅ Clean up test data after tests
- ✅ Support for raw SQL queries

### 2. **Test Environment Configuration** (`.env.test`)

Template for test-specific environment variables.

**Features:**
- Separate test database configuration
- Test API URL configuration
- Email/SMS service configuration for tests
- Clear documentation of all variables

### 3. **Updated Email Verification Tests** (`/tests/backend/emailVerification.test.ts`)

Fully automated integration tests with database auto-fetching.

**Features:**
- ✅ **Auto-fetch verification tokens** from database (no manual steps!)
- ✅ All 13 tests now properly sequential
- ✅ Automatic test data cleanup
- ✅ Connection lifecycle management

---

## 🚀 Quick Start

### Step 1: Set Up Test Environment

```bash
# Copy the test environment template
cp .env.test .env.test.local

# Edit .env.test.local with your actual values
# IMPORTANT: Use a SEPARATE test database!
```

**Example `.env.test.local`:**

```bash
# API URL (where your Deno backend is running)
API_URL=http://localhost:8000

# Test Database (SEPARATE from production!)
TEST_DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-test-db.gwc.azure.neon.tech/mediloop_test?sslmode=require

# Or use your dev database for local testing (be careful!)
# TEST_DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require
```

### Step 2: Run the Tests

```bash
# Make sure your backend is running first!
cd backend
deno task dev

# In another terminal, run the tests
cd tests/backend
deno test --allow-net --allow-env emailVerification.test.ts
```

---

## 📊 How It Works: Token Auto-Fetch

### Before (Manual Database Queries)

```typescript
// ❌ OLD WAY: Skipped tests if token wasn't manually set
const token = Deno.env.get("TEST_VERIFICATION_TOKEN");

if (!token) {
  console.log("Skipping test - no token set");
  return; // Test skipped! 🙁
}
```

### After (Auto-Fetch from Database)

```typescript
// ✅ NEW WAY: Auto-fetch token from database!
import { TestDb } from "../utils/testDb.ts";

const testDb = new TestDb();
await testDb.connect();

const token = await testDb.getVerificationToken(email);
// Token is fetched automatically! 🎉
```

---

## 📦 Using TestDb Utilities

### Basic Usage

```typescript
import { TestDb } from "../utils/testDb.ts";

const testDb = new TestDb();

// Connect to database
await testDb.connect();

try {
  // Use the utilities
  const token = await testDb.getVerificationToken("user@example.com");
  const isVerified = await testDb.isEmailVerified("user@example.com");
  
  // Your test code here...
  
} finally {
  // Always disconnect
  await testDb.close();
}
```

### Available Methods

#### Email Verification

```typescript
// Get latest unused verification token for a user
const token = await testDb.getVerificationToken(email);

// Check if email is verified
const isVerified = await testDb.isEmailVerified(email);

// Get all verification tokens (for debugging)
const allTokens = await testDb.getAllVerificationTokens(email);

// Get user by email
const user = await testDb.getUserByEmail(email);
```

#### Password Reset (for future tests)

```typescript
// Get password reset token
const resetToken = await testDb.getPasswordResetToken(email);
```

#### Organization Invitations (for future tests)

```typescript
// Get invitation token
const inviteToken = await testDb.getInvitationToken(email);
```

#### Test Data Cleanup

```typescript
// Delete a specific test user
await testDb.deleteTestUser("test-user@example.com");

// Delete all test users (emails starting with test-, integration-, etc.)
const deletedCount = await testDb.cleanupTestUsers();
console.log(`Cleaned up ${deletedCount} test users`);
```

#### Raw SQL (for custom scenarios)

```typescript
// Execute a query and get results
const results = await testDb.query<MyType>(
  "SELECT * FROM auth.users WHERE email = $1",
  [email]
);

// Execute a command (INSERT, UPDATE, DELETE)
const rowCount = await testDb.execute(
  "UPDATE auth.users SET email_verified = true WHERE email = $1",
  [email]
);
```

---

## 📝 Test Structure Pattern

### Recommended Test File Structure

```typescript
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { TestDb } from "../utils/testDb.ts";

const BASE_URL = Deno.env.get("API_URL") || "http://localhost:8000";
const testDb = new TestDb();

// Setup: Connect before tests
Deno.test("Setup: Connect to database", async () => {
  await testDb.connect();
});

// Your tests here...
Deno.test("My test", async () => {
  // Register user
  const email = `test-${Date.now()}@example.com`;
  await registerUser(email, password);
  
  // ✅ Auto-fetch token from database
  const token = await testDb.getVerificationToken(email);
  
  // Use the token
  await verifyEmail(token);
  
  // Check status
  const isVerified = await testDb.isEmailVerified(email);
  assertEquals(isVerified, true);
});

// Cleanup: Delete test users
Deno.test("Cleanup: Delete test users", async () => {
  await testDb.cleanupTestUsers();
});

// Cleanup: Disconnect after tests
Deno.test("Cleanup: Disconnect from database", async () => {
  await testDb.close();
});
```

---

## ✅ Fixed Issues

### Issue #1: Registration Status Code

**Problem:** Test expected `201 Created` but got `200 OK`

**Solution:** Updated `backend/modules/auth/routes/auth.ts`:

```typescript
// ✅ BEFORE:
ctx.response.body = { ... };

// ✅ AFTER:
ctx.response.status = 201;  // ← Added this line
ctx.response.body = { ... };
```

### Issue #2: Dependent Tests Failing

**Problem:** Tests #7 and #10 failed because they depended on Test #5 which skipped verification

**Solution:** Auto-fetch verification tokens from database instead of relying on environment variables

```typescript
// ❌ BEFORE: Test skipped if token not set
const token = Deno.env.get("TEST_VERIFICATION_TOKEN");
if (!token) return; // Skipped!

// ✅ AFTER: Token auto-fetched from database
const token = await testDb.getVerificationToken(email);
if (!token) throw new Error("No token found");
```

### Issue #3: No Automatic Cleanup

**Problem:** Test users accumulated in database

**Solution:** Added automatic cleanup with `testDb.cleanupTestUsers()`

---

## 🛠️ Troubleshooting

### "Database not connected" Error

```bash
# Make sure you call connect() first
await testDb.connect();
```

### "Database connection string not found"

```bash
# Set TEST_DATABASE_URL in .env.test.local
echo 'TEST_DATABASE_URL=postgresql://...' >> .env.test.local
```

### Tests Fail with "Connection refused"

```bash
# Make sure your backend is running
cd backend
deno task dev
```

### "No verification token found"

This usually means:
1. Email verification service didn't create a token
2. The email is already verified
3. Wrong database connection

**Check:**
```typescript
// Verify the user was created
const user = await testDb.getUserByEmail(email);
console.log("User:", user);

// Check all tokens for debugging
const allTokens = await testDb.getAllVerificationTokens(email);
console.log("All tokens:", allTokens);
```

---

## 📚 Future Test Patterns

You can now easily test:

### Password Reset Flow

```typescript
Deno.test("Password reset flow", async () => {
  // Request password reset
  await requestPasswordReset(email);
  
  // ✅ Auto-fetch reset token from database
  const token = await testDb.getPasswordResetToken(email);
  
  // Reset password
  await resetPassword(token, newPassword);
});
```

### Organization Invitations

```typescript
Deno.test("Organization invitation flow", async () => {
  // Send invitation
  await sendInvitation(email, orgId);
  
  // ✅ Auto-fetch invitation token from database
  const token = await testDb.getInvitationToken(email);
  
  // Accept invitation
  await acceptInvitation(token);
});
```

### Multi-User Scenarios

```typescript
Deno.test("Multi-user collaboration", async () => {
  // Create multiple users
  const users = [];
  for (let i = 0; i < 3; i++) {
    const email = `test-user-${i}-${Date.now()}@example.com`;
    await registerUser(email, password);
    
    // ✅ Auto-verify each user
    const token = await testDb.getVerificationToken(email);
    await verifyEmail(token);
    
    users.push(email);
  }
  
  // Test collaboration features...
});
```

---

## 🔒 Security Best Practices

1. **Use a separate test database** - NEVER test on production!
2. **Clean up test data** - Use `testDb.cleanupTestUsers()` after tests
3. **Never commit secrets** - Keep `.env.test.local` in `.gitignore`
4. **Use test-prefixed emails** - Makes cleanup easier (e.g., `test-*@example.com`)

---

## 🎯 Summary

**What you can do now:**

✅ Run fully automated integration tests  
✅ Auto-fetch verification tokens from database  
✅ No manual database queries needed  
✅ Automatic test data cleanup  
✅ Reusable test utilities for all backend tests  
✅ Easy to extend for password reset, invitations, etc.  

**Test coverage:**

- ✅ Email verification integration (13 tests)
- ✅ Email sending (6 tests from emailSend.test.ts)
- ✅ Registration flow
- ✅ Login flow with verification check
- ✅ Token validation
- ✅ Security (no user enumeration)

**Next steps:**

1. Run the tests to verify everything works
2. Use the same pattern for password reset tests
3. Use the same pattern for organization invitation tests
4. Add more utilities to `testDb.ts` as needed

---

## 👏 Contributors

Built with ❤️ for the Mediloop team to make testing easier and more reliable!

---

**Questions?** Check the test files for examples or ask the team!
