/**
 * ✅ INTEGRATED: databaseService.ts - WITH EMAIL VERIFICATION SUPPORT
 *
 * This version preserves ALL existing logic and adds email verification methods
 */

import { PostgresService } from "./postgresService.ts";
import { passwordService } from "../../modules/auth/services/passwordService.ts";
import { config } from "../config/env.ts";
import { User } from "../types/auth.ts";
import { Profile } from "../types/tenant.ts";

// Import email verification service (you'll need to add this file)
import { EmailVerificationService } from "../../modules/auth/services/emailVerificationService.ts";

export class DatabaseService {
  private postgresService: PostgresService;

  constructor(postgresService: PostgresService) {
    this.postgresService = postgresService;
  }

  /**
   * ✅ FIXED: Use passwordService (bcrypt) for password verification
   */
  async verifyUserPassword(
    email: string,
    passwordPlain: string,
  ): Promise<User> {
    const client = await this.postgresService.getClient();

    try {
      // Query auth.users table
      const result = await client.queryObject<User>(
        "SELECT id, email, phone, password_hash, full_name, role, role_id, email_verified, created_at, updated_at FROM auth.users WHERE email = $1 LIMIT 1",
        [email],
      );

      if (result.rows.length === 0) {
        throw new Error("Invalid login credentials");
      }

      const user = result.rows[0];

      if (!user.password_hash) {
        throw new Error("Password data not found for user");
      }

      // ✅ FIX: Use bcrypt verification via passwordService
      const passwordValid = await passwordService.verifyPassword(
        passwordPlain,
        user.password_hash,
      );

      if (!passwordValid) {
        throw new Error("Invalid login credentials");
      }

      console.log("✅ Password verification successful for:", email);
      return user;
    } catch (error) {
      console.error("Error verifying password:", error);
      throw new Error("Invalid login credentials");
    } finally {
      this.postgresService.releaseClient(client);
    }
  }

  async getUserProfile(userId: string, schema?: string): Promise<Profile> {
    const client = await this.postgresService.getClient();

    try {
      const schemaPrefix = schema ? `${schema}.` : "";
      const result = await client.queryObject<Profile>(
        `SELECT * FROM ${schemaPrefix}profiles WHERE user_id = $1 LIMIT 1`,
        [userId],
      );

      if (result.rows.length === 0) {
        throw new Error("Profile not found");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw new Error("Failed to fetch user profile");
    } finally {
      this.postgresService.releaseClient(client);
    }
  }

  async getUserByEmail(email: string): Promise<User> {
    const client = await this.postgresService.getClient();

    try {
      const result = await client.queryObject<User>(
        "SELECT * FROM auth.users WHERE email = $1 LIMIT 1",
        [email],
      );

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new Error("Failed to fetch user");
    } finally {
      this.postgresService.releaseClient(client);
    }
  }

  /**
   * ✅ NEW: Get user by phone number
   */
  async getUserByPhone(phone: string): Promise<User> {
    const client = await this.postgresService.getClient();

    try {
      const result = await client.queryObject<User>(
        "SELECT * FROM auth.users WHERE phone = $1 LIMIT 1",
        [phone],
      );

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Error fetching user by phone:", error);
      throw new Error("Failed to fetch user");
    } finally {
      this.postgresService.releaseClient(client);
    }
  }

  async createUser(
    email: string,
    passwordPlain: string,
    fullName: string,
    role: string,
    phone?: string,
  ): Promise<User> {
    const client = await this.postgresService.getClient();

    try {
      // ✅ FIX: Use bcrypt via passwordService
      const passwordHash = await passwordService.hashPassword(passwordPlain);

      // Look up role_id
      const roleResult = await client.queryObject<{ id: string }>(
        `SELECT id FROM public.roles WHERE name = $1 LIMIT 1`,
        [role],
      );

      if (roleResult.rows.length === 0) {
        throw new Error(`Role "${role}" not found in public.roles table`);
      }

      const roleId = roleResult.rows[0].id;

      // ✅ NEW: Insert with email_verified = false (will be verified after email verification)
      const result = await client.queryObject<User>(
        `INSERT INTO auth.users (email, phone, password_hash, full_name, role, role_id, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW())
         RETURNING *`,
        [email, phone, passwordHash, fullName, role, roleId],
      );

      if (result.rows.length === 0) {
        throw new Error("Failed to insert user");
      }

      console.log("New user created in auth.users:", email);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    } finally {
      this.postgresService.releaseClient(client);
    }
  }

  async updateUserPassword(email: string, newPassword: string): Promise<void> {
    const client = await this.postgresService.getClient();

    try {
      // ✅ FIX: Use bcrypt via passwordService
      const passwordHash = await passwordService.hashPassword(newPassword);

      // Update the password in auth.users
      const result = await client.queryObject(
        "UPDATE auth.users SET password_hash = $1, updated_at = NOW() WHERE email = $2",
        [passwordHash, email],
      );

      if (result.rowCount === 0) {
        throw new Error("User not found");
      }

      console.log("Password updated successfully for user:", email);
    } finally {
      this.postgresService.releaseClient(client);
    }
  }

  /**
   * ✅ NEW METHOD: Create user in auth.users only (no tenant schema profile)
   * This is simpler and matches true multi-tenant architecture
   */
  async createUserInAuthTable(
    userId: string,
    email: string,
    fullName: string,
    passwordHash: string,
    role: string,
    phone?: string,
  ): Promise<User> {
    const client = await this.postgresService.getClient();

    try {
      // Look up role_id from public.roles
      console.log("🔍 Looking up role_id for role:", role);
      const roleResult = await client.queryObject<{ id: string }>(
        `SELECT id FROM public.roles WHERE name = $1 LIMIT 1`,
        [role],
      );

      if (roleResult.rows.length === 0) {
        throw new Error(`Role "${role}" not found in public.roles table`);
      }

      const roleId = roleResult.rows[0].id;
      console.log("✅ Found role_id:", roleId, "for role:", role);

      // ✅ NEW: Insert with email_verified = false
      console.log("📝 Inserting into auth.users...");
      const userResult = await client.queryObject<User>(
        `INSERT INTO auth.users (id, email, phone, password_hash, full_name, role, role_id, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW(), NOW())
         RETURNING *`,
        [userId, email, phone, passwordHash, fullName, role, roleId],
      );

      if (userResult.rows.length === 0) {
        throw new Error("Failed to insert user in auth.users");
      }

      const user = userResult.rows[0];
      console.log("✅ User created in auth.users:", email);

      return user;
    } catch (error) {
      console.error("❌ Error in createUserInAuthTable:", error);
      throw error;
    } finally {
      this.postgresService.releaseClient(client);
    }
  }

  /**
   * ✅ DEPRECATED: Use createUserInAuthTable() instead
   * Keeping this for backward compatibility but should be removed
   */
  async createUserWithPasswordInSchema(
    schema: string,
    userId: string,
    email: string,
    fullName: string,
    passwordHash: string,
    role: string,
    phone?: string,
  ): Promise<{ user: User; profile: Profile }> {
    console.warn(
      "⚠️ createUserWithPasswordInSchema is deprecated - use createUserInAuthTable instead",
    );

    const user = await this.createUserInAuthTable(
      userId,
      email,
      fullName,
      passwordHash,
      role,
      phone,
    );

    // ✅ FIXED: Return dummy profile with correct date format (strings)
    return {
      user,
      profile: {
        id: userId,
        user_id: userId,
        full_name: fullName,
        email: email,
        phone: phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Profile,
    };
  }

  // ============================================================================
  // ✅ NEW: EMAIL VERIFICATION METHODS (added for email verification support)
  // ============================================================================

  /**
   * Create email verification token
   */
  async createEmailVerificationToken(
    userId: string,
    tenantId: string,
    email: string,
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    const client = await this.postgresService.getClient();
    try {
      return await EmailVerificationService.createVerificationToken(
        client,
        userId,
        tenantId,
        email,
      );
    } finally {
      this.postgresService.releaseClient(client);
    }
  }

  /**
   * Verify email verification token
   */
  async verifyEmailToken(token: string): Promise<{
    success: boolean;
    userId?: string;
    email?: string;
    error?: string;
  }> {
    const client = await this.postgresService.getClient();
    try {
      return await EmailVerificationService.verifyToken(client, token);
    } finally {
      this.postgresService.releaseClient(client);
    }
  }

  /**
   * Check if user's email is verified
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    const client = await this.postgresService.getClient();
    try {
      return await EmailVerificationService.isEmailVerified(client, userId);
    } finally {
      this.postgresService.releaseClient(client);
    }
  }

  /**
   * Get pending verification for user
   */
  async getPendingEmailVerification(userId: string): Promise<any> {
    const client = await this.postgresService.getClient();
    try {
      return await EmailVerificationService.getPendingVerification(
        client,
        userId,
      );
    } finally {
      this.postgresService.releaseClient(client);
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(
    userId: string,
    tenantId: string,
    email: string,
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    const client = await this.postgresService.getClient();
    try {
      return await EmailVerificationService.resendVerification(
        client,
        userId,
        tenantId,
        email,
      );
    } finally {
      this.postgresService.releaseClient(client);
    }
  }

  /**
   * Cleanup expired verification tokens (should be run via cron)
   */
  async cleanupExpiredVerificationTokens(): Promise<number> {
    const client = await this.postgresService.getClient();
    try {
      return await EmailVerificationService.cleanupExpiredTokens(client);
    } finally {
      this.postgresService.releaseClient(client);
    }
  }
}

export const databaseService = new DatabaseService(new PostgresService());
