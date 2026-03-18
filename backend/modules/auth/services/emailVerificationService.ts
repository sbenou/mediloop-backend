/**
 * Email Verification Service
 * Handles email verification token generation, validation, and verification
 * Part of Mediloop V2 Authentication System
 */

import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

export interface EmailVerification {
  id: string;
  user_id: string;
  tenant_id: string;
  email: string;
  token: string;
  verified: boolean;
  expires_at: Date;
  verified_at: Date | null;
  created_at: Date;
}

export interface CreateVerificationTokenResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface VerifyTokenResult {
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

export class EmailVerificationService {
  /**
   * Create a new email verification token
   * @param client - Database client
   * @param userId - User ID
   * @param tenantId - Tenant ID
   * @param email - User email
   * @param expirationHours - Token expiration in hours (default: 24)
   */
  static async createVerificationToken(
    client: Client,
    userId: string,
    tenantId: string,
    email: string,
    expirationHours: number = 24,
  ): Promise<CreateVerificationTokenResult> {
    try {
      // Generate a secure random token
      const token = crypto.randomUUID();

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      // Delete any existing unverified tokens for this user
      await client.queryObject(
        `DELETE FROM auth.email_verifications 
         WHERE user_id = $1 AND verified = false`,
        [userId],
      );

      // Insert new verification token
      const result = await client.queryObject<EmailVerification>(
        `INSERT INTO auth.email_verifications 
         (user_id, tenant_id, email, token, expires_at, verified)
         VALUES ($1, $2, $3, $4, $5, false)
         RETURNING *`,
        [userId, tenantId, email, token, expiresAt],
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Failed to create verification token",
        };
      }

      return {
        success: true,
        token,
      };
    } catch (error) {
      console.error("Error creating verification token:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Verify an email verification token
   * @param client - Database client
   * @param token - Verification token
   */
  static async verifyToken(
    client: Client,
    token: string,
  ): Promise<VerifyTokenResult> {
    try {
      // Find the verification token
      const result = await client.queryObject<EmailVerification>(
        `SELECT * FROM auth.email_verifications 
         WHERE token = $1 AND verified = false`,
        [token],
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: "Invalid or already used verification token",
        };
      }

      const verification = result.rows[0];

      // Check if token has expired
      if (new Date() > new Date(verification.expires_at)) {
        return {
          success: false,
          error: "Verification token has expired",
        };
      }

      // Mark token as verified
      await client.queryObject(
        `UPDATE auth.email_verifications 
         SET verified = true, verified_at = NOW() 
         WHERE id = $1`,
        [verification.id],
      );

      // Mark user as verified
      await client.queryObject(
        `UPDATE auth.users 
         SET email_verified = true 
         WHERE id = $1`,
        [verification.user_id],
      );

      return {
        success: true,
        userId: verification.user_id,
        email: verification.email,
      };
    } catch (error) {
      console.error("Error verifying token:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if a user's email is verified
   * @param client - Database client
   * @param userId - User ID
   */
  static async isEmailVerified(
    client: Client,
    userId: string,
  ): Promise<boolean> {
    try {
      const result = await client.queryObject<{ email_verified: boolean }>(
        `SELECT email_verified FROM auth.users WHERE id = $1`,
        [userId],
      );

      if (result.rows.length === 0) {
        return false;
      }

      return result.rows[0].email_verified ?? false;
    } catch (error) {
      console.error("Error checking email verification status:", error);
      return false;
    }
  }

  /**
   * Get pending verification for a user
   * @param client - Database client
   * @param userId - User ID
   */
  static async getPendingVerification(
    client: Client,
    userId: string,
  ): Promise<EmailVerification | null> {
    try {
      const result = await client.queryObject<EmailVerification>(
        `SELECT * FROM auth.email_verifications 
         WHERE user_id = $1 AND verified = false 
         AND expires_at > NOW()
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId],
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("Error getting pending verification:", error);
      return null;
    }
  }

  /**
   * Cleanup expired verification tokens
   * Should be run periodically (e.g., via cron job)
   * @param client - Database client
   */
  static async cleanupExpiredTokens(client: Client): Promise<number> {
    try {
      const result = await client.queryObject(
        `DELETE FROM auth.email_verifications 
         WHERE expires_at < NOW() AND verified = false`,
      );

      return result.rowCount ?? 0;
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
      return 0;
    }
  }

  /**
   * Resend verification email (creates new token)
   * @param client - Database client
   * @param userId - User ID
   * @param tenantId - Tenant ID
   * @param email - User email
   */
  static async resendVerification(
    client: Client,
    userId: string,
    tenantId: string,
    email: string,
  ): Promise<CreateVerificationTokenResult> {
    try {
      // Check if user is already verified
      const isVerified = await this.isEmailVerified(client, userId);
      if (isVerified) {
        return {
          success: false,
          error: "Email is already verified",
        };
      }

      // Create new verification token
      return await this.createVerificationToken(
        client,
        userId,
        tenantId,
        email,
      );
    } catch (error) {
      console.error("Error resending verification:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
