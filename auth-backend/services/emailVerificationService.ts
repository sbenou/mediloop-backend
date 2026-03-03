import { postgresService } from "./postgresService.ts";
import { emailService } from "./emailService.ts";

export class EmailVerificationService {
  private readonly VERIFICATION_EXPIRY_HOURS = 24;

  /**
   * Create a verification token and store it
   */
  async createVerificationToken(
    email: string,
    userId: string,
    tenantId: string,
    fullName: string,
  ): Promise<string> {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.VERIFICATION_EXPIRY_HOURS);

    await postgresService.query(
      `INSERT INTO auth.email_verifications (token, user_id, tenant_id, email, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [token, userId, tenantId, email, expiresAt.toISOString()],
    );

    // Send verification email
    await emailService.sendVerificationEmail(email, fullName, token);

    console.log(`✅ Verification email sent to: ${email}`);
    return token;
  }

  /**
   * Verify the token and activate the user account
   */
  async verifyToken(token: string): Promise<{
    userId: string;
    email: string;
    tenantId: string;
  }> {
    // Get verification record
    const result = await postgresService.query(
      `SELECT * FROM auth.email_verifications 
       WHERE token = $1 AND verified = false AND expires_at > NOW()
       LIMIT 1`,
      [token],
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid or expired verification token");
    }

    const verification = result.rows[0];

    // Mark user as verified in auth.users
    await postgresService.query(
      `UPDATE auth.users 
       SET email_verified = true, updated_at = NOW()
       WHERE id = $1`,
      [verification.user_id],
    );

    // Mark verification as used
    await postgresService.query(
      `UPDATE auth.email_verifications 
       SET verified = true, verified_at = NOW()
       WHERE token = $1`,
      [token],
    );

    console.log(`✅ Email verified for user: ${verification.email}`);

    return {
      userId: verification.user_id,
      email: verification.email,
      tenantId: verification.tenant_id,
    };
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<void> {
    // Get user info
    const userResult = await postgresService.query(
      `SELECT u.id, u.email, u.full_name, ut.tenant_id
       FROM auth.users u
       JOIN public.user_tenants ut ON u.id = ut.user_id AND ut.is_primary = true
       WHERE u.email = $1 AND u.email_verified = false
       LIMIT 1`,
      [email],
    );

    if (userResult.rows.length === 0) {
      throw new Error("User not found or already verified");
    }

    const user = userResult.rows[0];

    // Delete old tokens
    await postgresService.query(
      `DELETE FROM auth.email_verifications WHERE user_id = $1`,
      [user.id],
    );

    // Create new token
    await this.createVerificationToken(
      user.email,
      user.id,
      user.tenant_id,
      user.full_name,
    );
  }
}

export const emailVerificationService = new EmailVerificationService();
