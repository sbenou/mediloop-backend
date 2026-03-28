/**
 * Test Database Utilities
 * Reusable database connection and query helpers for Deno tests
 *
 * Usage:
 *   import { TestDb } from "./utils/testDb.ts";
 *   const testDb = new TestDb();
 *   await testDb.connect();
 *   const token = await testDb.getVerificationToken(email);
 *   await testDb.close();
 */

import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { resolveEnvTestPath } from "./resolveEnvTestPath.ts";

// ✅ Load repo-root `.env.test` even when cwd is `backend/` (see resolveEnvTestPath)
const envTestPath = await resolveEnvTestPath();
const env = envTestPath
  ? await load({ envPath: envTestPath, export: true, allowEmptyValues: true })
  : await load({ envPath: ".env.test", export: true, allowEmptyValues: true });
if (envTestPath && env.TEST_DATABASE_URL) {
  console.log(`🔧 Loaded .env.test from ${envTestPath}`);
  console.log(`📊 TEST_DATABASE_URL: ${env.TEST_DATABASE_URL.substring(0, 50)}...`);
} else if (env.TEST_DATABASE_URL) {
  console.log("🔧 Loaded .env.test file");
  console.log(`📊 TEST_DATABASE_URL: ${env.TEST_DATABASE_URL.substring(0, 50)}...`);
}

export interface VerificationToken {
  token: string;
  user_id: string;
  email: string;
  tenant_id: string;
  created_at: Date;
  expires_at: Date;
  verified: boolean;
}

export interface TestUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export class TestDb {
  private client: Client | null = null;
  private connected = false;

  /**
   * Connect to the test database
   * Uses environment variables for connection
   */
  async connect(): Promise<void> {
    if (this.connected && this.client) {
      return; // Already connected
    }

    const databaseUrl =
      Deno.env.get("TEST_DATABASE_URL") || Deno.env.get("DATABASE_URL");

    if (!databaseUrl) {
      throw new Error(
        "Database connection string not found. Set TEST_DATABASE_URL or DATABASE_URL environment variable.",
      );
    }

    // Parse the connection string
    const url = new URL(databaseUrl);
    const hostname = url.hostname;
    const port = parseInt(url.port || "5432");
    const username = url.username;
    const password = url.password;
    const database = url.pathname.split("/")[1];

    this.client = new Client({
      hostname,
      port,
      user: username,
      password,
      database,
      tls: {
        enabled: true,
        enforce: false, // Neon requires SSL but we don't need strict cert verification for tests
      },
    });

    await this.client.connect();
    this.connected = true;
    console.log("✅ Test database connected:", hostname);
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
      this.connected = false;
      console.log("✅ Test database disconnected");
    }
  }

  /**
   * Ensure connection is established
   */
  private ensureConnected(): void {
    if (!this.connected || !this.client) {
      throw new Error("Database not connected. Call connect() first.");
    }
  }

  // ============================================================================
  // EMAIL VERIFICATION HELPERS
  // ============================================================================

  /**
   * Get the latest verification token for a user by email
   * Returns the most recent unused token
   */
  async getVerificationToken(email: string): Promise<string | null> {
    this.ensureConnected();

    const result = await this.client!.queryObject<{ token: string }>(
      `SELECT token 
       FROM auth.email_verifications 
       WHERE user_id = (SELECT id FROM auth.users WHERE email = $1) 
       AND verified = false 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].token;
  }

  /**
   * Get all verification tokens for a user (useful for debugging)
   */
  async getAllVerificationTokens(email: string): Promise<VerificationToken[]> {
    this.ensureConnected();

    const result = await this.client!.queryObject<VerificationToken>(
      `SELECT * 
       FROM auth.email_verifications 
       WHERE user_id = (SELECT id FROM auth.users WHERE email = $1) 
       ORDER BY created_at DESC`,
      [email],
    );

    return result.rows;
  }

  /**
   * Check if a user's email is verified
   */
  async isEmailVerified(email: string): Promise<boolean> {
    this.ensureConnected();

    const result = await this.client!.queryObject<{ email_verified: boolean }>(
      `SELECT email_verified FROM auth.users WHERE email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      throw new Error(`User not found: ${email}`);
    }

    return result.rows[0].email_verified;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<TestUser | null> {
    this.ensureConnected();

    const result = await this.client!.queryObject<TestUser>(
      `SELECT id, email, full_name, role, email_verified, created_at, updated_at 
       FROM auth.users 
       WHERE email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  // ============================================================================
  // PASSWORD RESET HELPERS (for future tests)
  // ============================================================================

  /**
   * Get password reset token for a user
   */
  async getPasswordResetToken(email: string): Promise<string | null> {
    this.ensureConnected();

    const result = await this.client!.queryObject<{ token: string }>(
      `SELECT token 
       FROM auth.password_reset_tokens 
       WHERE user_id = (SELECT id FROM auth.users WHERE email = $1) 
       AND verified = false 
       AND expires_at > NOW() 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].token;
  }

  // ============================================================================
  // ORGANIZATION INVITATION HELPERS (for future tests)
  // ============================================================================

  /**
   * Get invitation token for a user
   */
  async getInvitationToken(email: string): Promise<string | null> {
    this.ensureConnected();

    const result = await this.client!.queryObject<{ token: string }>(
      `SELECT token 
       FROM public.organization_invitations 
       WHERE email = $1 
       AND status = 'pending' 
       AND expires_at > NOW() 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].token;
  }

  // ============================================================================
  // TEST DATA CLEANUP HELPERS
  // ============================================================================

  /**
   * Delete test user and all related data
   * Useful for cleanup after tests
   */
  async deleteTestUser(email: string): Promise<void> {
    this.ensureConnected();

    // Get user ID first
    const userResult = await this.client!.queryObject<{ id: string }>(
      `SELECT id FROM auth.users WHERE email = $1`,
      [email],
    );

    if (userResult.rows.length === 0) {
      console.log(`User not found for deletion: ${email}`);
      return;
    }

    const userId = userResult.rows[0].id;

    // Delete in order to respect foreign key constraints
    await this.client!.queryArray(
      `DELETE FROM auth.email_verifications WHERE user_id = $1`,
      [userId],
    );

    await this.client!.queryArray(
      `DELETE FROM auth.password_reset_tokens WHERE user_id = $1`,
      [userId],
    );

    await this.client!.queryArray(
      `DELETE FROM auth.sessions WHERE user_id = $1`,
      [userId],
    );

    await this.client!.queryArray(
      `DELETE FROM public.user_tenants WHERE user_id = $1`,
      [userId],
    );

    await this.client!.queryArray(`DELETE FROM auth.users WHERE id = $1`, [
      userId,
    ]);

    console.log(`✅ Deleted test user: ${email}`);
  }

  /**
   * Delete all test users (emails starting with "test-" or "integration-")
   */
  async cleanupTestUsers(): Promise<number> {
    this.ensureConnected();

    const result = await this.client!.queryObject<{ email: string }>(
      `SELECT email FROM auth.users 
       WHERE email LIKE 'test-%' 
       OR email LIKE 'integration-%' 
       OR email LIKE 'get-test-%'`,
    );

    for (const row of result.rows) {
      await this.deleteTestUser(row.email);
    }

    return result.rows.length;
  }

  // ============================================================================
  // RAW QUERY HELPERS (for custom queries in tests)
  // ============================================================================

  /**
   * Execute a raw SQL query (for custom test scenarios)
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    this.ensureConnected();

    const result = await this.client!.queryObject<T>(sql, params);
    return result.rows;
  }

  /**
   * Execute a raw SQL command (INSERT, UPDATE, DELETE)
   */
  async execute(sql: string, params?: any[]): Promise<number> {
    this.ensureConnected();

    const result = await this.client!.queryArray(sql, params);
    return result.rowCount || 0;
  }
}

/**
 * Global test database instance (optional singleton pattern)
 * You can use this or create new instances as needed
 */
export const testDb = new TestDb();
