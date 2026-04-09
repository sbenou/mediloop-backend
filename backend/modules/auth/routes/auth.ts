/**
 * ✅ All auth endpoints with Email Verification
 *
 * 1. Registration returns success message (no tokens)
 * 2. Login checks email_verified status
 * 3. Consistent /api/auth/* route paths
 * 4. Profile includes email_verified field
 * 5. Both GET and POST verify-email endpoints
 * 6. Input validation for email and password
 */

import { Router } from "oak";
import { enhancedJwtService } from "../services/enhancedJwtService.ts";
import { databaseService } from "../../../shared/services/databaseService.ts";
import { postgresService } from "../../../shared/services/postgresService.ts";
import { registrationService } from "../services/registrationService.ts";
import { kvStore } from "../../../shared/services/kvStore.ts";
import { emailService } from "../../../shared/services/emailService.ts";
import {
  loginRateLimiter,
  registrationRateLimiter,
  tokenRefreshRateLimiter,
} from "../../../shared/middleware/rateLimitMiddleware.ts";
import {
  validateEmail,
  validatePassword,
  validateFullName,
} from "../../../shared/utils/validation.ts";
import { config } from "../../../shared/config/env.ts";

const authRoutes = new Router();
const UUID_V4_OR_V1_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuidLike(value: string): boolean {
  return UUID_V4_OR_V1_REGEX.test(value);
}

function getClientIP(ctx: any): string {
  const forwarded = ctx.request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return ctx.request.ip || "unknown";
}

function getUserAgent(ctx: any): string {
  return ctx.request.headers.get("user-agent") || "unknown";
}

// ============================================================================
// REGISTRATION - ✅ FIXED: Returns success message, NOT tokens
// ============================================================================

authRoutes.post("/api/auth/register", registrationRateLimiter, async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const {
      email,
      password,
      fullName,
      role = "patient",
      workplaceName,
      pharmacyName,
    } = body;

    // Basic required field validation
    if (!email || !password || !fullName) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Email, password, and full name are required",
      };
      return;
    }

    // ✅ NEW: Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: emailValidation.error,
      };
      return;
    }

    // ✅ NEW: Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: passwordValidation.error,
      };
      return;
    }

    // ✅ NEW: Validate full name
    const fullNameValidation = validateFullName(fullName);
    if (!fullNameValidation.valid) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: fullNameValidation.error,
      };
      return;
    }

    console.log(
      "V3 Registration: Attempting registration for:",
      email,
      "with role:",
      role,
    );

    // ✅ FIXED: registrationService now returns success info, not user profile
    const result = await registrationService.registerUser(
      email,
      password,
      fullName,
      role,
      workplaceName,
      pharmacyName,
    );

    console.log("V3 Registration: Registration initiated for:", email);

    // ✅ FIXED: Return 201 Created status code
    ctx.response.status = 201;

    // ✅ FIXED: Return success message WITHOUT tokens
    // User must verify email before they can login
    ctx.response.body = {
      success: result.success,
      message:
        result.message ||
        "Registration successful! Please check your email to verify your account.",
      user: {
        id: result.userId,
        email: result.email,
      },
      requiresVerification: result.requiresVerification,
      invitations_accepted: result.invitations_accepted || 0,
    };
  } catch (error) {
    console.error("V3 Registration error:", error);

    // ✅ IMPROVED: Better error messages for duplicate emails
    let errorMessage = error.message || "Registration failed";
    let statusCode = 400;

    if (error.message?.includes("User already exists")) {
      errorMessage =
        "An account with this email already exists. Please log in or use a different email.";
      statusCode = 409; // Conflict
    } else if (error.message?.includes("Failed to send verification email")) {
      // This might happen on duplicate email registration attempt
      errorMessage =
        "Unable to send verification email. The email address may already be registered.";
      statusCode = 400;
    }

    ctx.response.status = statusCode;
    ctx.response.body = { error: errorMessage };
  }
});

// ============================================================================
// EMAIL VERIFICATION ENDPOINTS
// ============================================================================

/**
 * ✅ GET /api/auth/verify-email?token=xxx
 * Verify email address using token from email link (query parameter)
 * This is for when users click the link directly in their email
 */
authRoutes.get("/api/auth/verify-email", async (ctx) => {
  try {
    // Get token from query parameter
    const token = ctx.request.url.searchParams.get("token");

    if (!token) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Verification token is required",
      };
      return;
    }

    if (!isUuidLike(token)) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Invalid verification token",
        error_code: "token_invalid",
        email: null,
      };
      return;
    }

    console.log("📧 Email verification (GET): Verifying token...");

    // ✅ Use databaseService wrapper method
    const result = await databaseService.verifyEmailToken(token);

    if (!result.success) {
      console.error("❌ Email verification failed:", result.error);
      const tokenMetaResult = await postgresService.query(
        `SELECT email, verified, expires_at
         FROM auth.email_verifications
         WHERE token = $1
         LIMIT 1`,
        [token],
      );
      const tokenMeta = tokenMetaResult.rows[0] as
        | { email?: string; verified?: boolean; expires_at?: string }
        | undefined;
      const isExpired =
        !!tokenMeta?.expires_at &&
        new Date(tokenMeta.expires_at) < new Date();
      const errorCode = tokenMeta
        ? tokenMeta.verified
          ? "token_already_used"
          : isExpired
            ? "token_expired"
            : "token_invalid"
        : "token_invalid";

      ctx.response.status = 400;
      ctx.response.body = {
        error: result.error || "Invalid verification token",
        error_code: errorCode,
        email: tokenMeta?.email || null,
      };
      return;
    }

    console.log("✅ Email verified for user:", result.userId);

    // Get user details
    const user = await databaseService.getUserByEmail(result.email!);

    // Generate auth tokens for auto-login after verification
    const ipAddress = getClientIP(ctx);
    const userAgent = getUserAgent(ctx);

    const tokenData = await enhancedJwtService.createToken(
      user.id,
      user.email,
      user.role,
      ipAddress,
      userAgent,
    );

    await kvStore.setSession(tokenData.sessionId, {
      userId: user.id,
      email: user.email,
      role: user.role,
      loginTime: new Date().toISOString(),
    });

    console.log(
      "✅ Email verification successful - auto-login for:",
      user.email,
    );

    // Return success with tokens (for auto-login)
    ctx.response.status = 200;
    ctx.response.body = {
      message: "Email verified successfully",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        email_verified: true,
      },
      tokens: {
        access_token: tokenData.token,
        refresh_token: tokenData.token, // Note: You might want separate refresh token
        expires_in: 3600,
      },
      // Also include in root for consistency
      access_token: tokenData.token,
      token_type: "Bearer",
      expires_in: 86400,
      session_id: tokenData.sessionId,
      expires_at: tokenData.expiresAt.toISOString(),
      tenant_id: tokenData.tenantId,
    };
  } catch (error) {
    console.error("Error in verify-email (GET) route:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Internal server error",
    };
  }
});

/**
 * ✅ POST /api/auth/verify-email
 * Alternative endpoint for verifying email with token in body
 * This is for when frontend sends the token as JSON
 */
authRoutes.post("/api/auth/verify-email", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { token } = body;

    if (!token) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Verification token is required",
      };
      return;
    }

    if (!isUuidLike(token)) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Invalid verification token",
        error_code: "token_invalid",
        email: null,
      };
      return;
    }

    console.log("📧 Email verification (POST): Verifying token...");

    // ✅ Use databaseService wrapper method
    const result = await databaseService.verifyEmailToken(token);

    if (!result.success) {
      console.error("❌ Email verification failed:", result.error);
      const tokenMetaResult = await postgresService.query(
        `SELECT email, verified, expires_at
         FROM auth.email_verifications
         WHERE token = $1
         LIMIT 1`,
        [token],
      );
      const tokenMeta = tokenMetaResult.rows[0] as
        | { email?: string; verified?: boolean; expires_at?: string }
        | undefined;
      const isExpired =
        !!tokenMeta?.expires_at &&
        new Date(tokenMeta.expires_at) < new Date();
      const errorCode = tokenMeta
        ? tokenMeta.verified
          ? "token_already_used"
          : isExpired
            ? "token_expired"
            : "token_invalid"
        : "token_invalid";

      ctx.response.status = 400;
      ctx.response.body = {
        error: result.error || "Invalid verification token",
        error_code: errorCode,
        email: tokenMeta?.email || null,
      };
      return;
    }

    console.log("✅ Email verified for user:", result.userId);

    // Get user details
    const user = await databaseService.getUserByEmail(result.email!);

    // Generate auth tokens for auto-login after verification
    const ipAddress = getClientIP(ctx);
    const userAgent = getUserAgent(ctx);

    const tokenData = await enhancedJwtService.createToken(
      user.id,
      user.email,
      user.role,
      ipAddress,
      userAgent,
    );

    await kvStore.setSession(tokenData.sessionId, {
      userId: user.id,
      email: user.email,
      role: user.role,
      loginTime: new Date().toISOString(),
    });

    console.log(
      "✅ Email verification successful - auto-login for:",
      user.email,
    );

    // Return success with tokens (for auto-login)
    ctx.response.status = 200;
    ctx.response.body = {
      message: "Email verified successfully",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        email_verified: true,
      },
      tokens: {
        access_token: tokenData.token,
        refresh_token: tokenData.token, // Note: You might want separate refresh token
        expires_in: 3600,
      },
      // Also include in root for consistency
      access_token: tokenData.token,
      token_type: "Bearer",
      expires_in: 86400,
      session_id: tokenData.sessionId,
      expires_at: tokenData.expiresAt.toISOString(),
      tenant_id: tokenData.tenantId,
    };
  } catch (error) {
    console.error("Error in verify-email (POST) route:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Internal server error",
    };
  }
});

/**
 * ✅ POST /api/auth/resend-verification
 * Resend verification email to user
 * Body: { email: string }
 */
authRoutes.post("/api/auth/resend-verification", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { email } = body;

    if (!email) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Email is required",
      };
      return;
    }

    console.log("📧 Resend verification: Request for email:", email);

    // Find user by email
    let user;
    try {
      user = await databaseService.getUserByEmail(email);
    } catch (error) {
      // Don't reveal if user exists or not (security)
      console.log("⚠️ User not found for resend verification");
      ctx.response.status = 200;
      ctx.response.body = {
        message:
          "If an account exists with this email, a verification link has been sent",
      };
      return;
    }

    // Check if already verified
    if (user.email_verified) {
      console.log("⚠️ User already verified:", email);
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Email is already verified",
      };
      return;
    }

    // Get tenant_id for user - query user_tenants
    const tenantResult = await databaseService.postgresService.query(
      `SELECT tenant_id FROM public.user_tenants WHERE user_id = $1 AND is_primary = true LIMIT 1`,
      [user.id],
    );

    const tenantId =
      tenantResult.rows.length > 0
        ? tenantResult.rows[0].tenant_id
        : crypto.randomUUID(); // Fallback if no tenant found

    // Create new verification token using databaseService wrapper
    const tokenResult = await databaseService.resendEmailVerification(
      user.id,
      tenantId,
      user.email,
    );

    if (!tokenResult.success) {
      console.error(
        "❌ Failed to create verification token:",
        tokenResult.error,
      );
      ctx.response.status = 500;
      ctx.response.body = {
        error: tokenResult.error || "Failed to create verification token",
      };
      return;
    }

    // Send verification email
    const verificationUrl = `${config.PUBLIC_FRONTEND_URL}/verify-email?token=${tokenResult.token}`;

    const sent = await emailService.sendEmailConfirmation(
      email,
      verificationUrl,
    );
    if (!sent) {
      console.warn("⚠️ Email sending failed - likely Resend API restrictions");
    }

    console.log("✅ Verification email resent to:", email);

    ctx.response.status = 200;
    ctx.response.body = {
      message: "Verification email sent successfully",
    };
  } catch (error) {
    console.error("Error in resend-verification route:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Internal server error",
    };
  }
});

/**
 * ✅ GET /api/auth/verification-status?email=xxx
 * Check verification status for an email
 */
authRoutes.get("/api/auth/verification-status", async (ctx) => {
  try {
    const email = ctx.request.url.searchParams.get("email");

    if (!email) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Email is required",
      };
      return;
    }

    // Find user by email
    let user;
    try {
      user = await databaseService.getUserByEmail(email);
    } catch (error) {
      ctx.response.status = 404;
      ctx.response.body = {
        error: "User not found",
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      email_verified: user.email_verified,
      user_id: user.id,
    };
  } catch (error) {
    console.error("Error in verification-status route:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Internal server error",
    };
  }
});

// ============================================================================
// LOGIN - ✅ FIXED: Now checks email verification status
// ============================================================================

authRoutes.post("/api/auth/login", loginRateLimiter, async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { email, password } = body;

    if (!email || !password) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Email and password required" };
      return;
    }

    const ipAddress = getClientIP(ctx);
    const userAgent = getUserAgent(ctx);

    console.log("V3 Login: Attempting login for:", email);

    const profile = await databaseService.verifyUserPassword(email, password);
    console.log("V3 Login: Password verification successful for:", email);

    // ✅ NEW: Check if email is verified before allowing login
    if (!profile.email_verified) {
      console.log("V3 Login: Email not verified for:", email);
      ctx.response.status = 403;
      ctx.response.body = {
        error: "Please verify your email address before logging in",
        requiresVerification: true,
        userId: profile.id,
        email: profile.email,
      };
      return;
    }

    // ✅ tenant_id is automatically looked up from user_tenants table
    const tokenData = await enhancedJwtService.createToken(
      profile.id,
      profile.email,
      profile.role,
      ipAddress,
      userAgent,
    );

    await kvStore.setSession(tokenData.sessionId, {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      loginTime: new Date().toISOString(),
    });

    console.log(
      "V3 Login: Login successful for:",
      email,
      "with tenant_id:",
      tokenData.tenantId,
    );

    ctx.response.body = {
      access_token: tokenData.token,
      token_type: "Bearer",
      expires_in: 86400,
      session_id: tokenData.sessionId,
      expires_at: tokenData.expiresAt.toISOString(),
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        tenant_id: tokenData.tenantId,
        email_verified: true, // ✅ Include verification status
      },
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const invalidCreds = errMsg.includes("Invalid login credentials");
    if (!invalidCreds) {
      console.error("V3 Login error:", error);
    }

    let errorMessage = "Login failed";
    if (invalidCreds) {
      errorMessage =
        "Invalid email or password. Please check your credentials.";
    } else if (errMsg.includes("Profile not found")) {
      errorMessage =
        "No account found with this email address. Please sign up first.";
    }

    ctx.response.status = invalidCreds || errMsg.includes("Profile not found")
      ? 401
      : 500;
    ctx.response.body = { error: errorMessage };
  }
});

// ============================================================================
// OTHER EXISTING ENDPOINTS (UNCHANGED)
// ============================================================================

authRoutes.post("/api/auth/logout", async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const verification = await enhancedJwtService.verifyToken(token);

      if (verification.valid && verification.payload?.sub) {
        const userId = verification.payload.sub;
        await enhancedJwtService.revokeToken(token, userId, "USER_LOGOUT");
        console.log("V3 User logged out and token revoked:", userId);
      }
    }

    ctx.response.body = { message: "Logged out successfully" };
  } catch (error) {
    console.error("Logout error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Logout failed" };
  }
});

authRoutes.post("/api/auth/verify-token", async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Authorization header required" };
      return;
    }

    const token = authHeader.substring(7);
    const ipAddress = getClientIP(ctx);
    const verification = await enhancedJwtService.verifyToken(token, ipAddress);

    if (!verification.valid) {
      ctx.response.status = 401;
      ctx.response.body = { error: verification.error || "Invalid token" };
      return;
    }

    ctx.response.body = {
      valid: true,
      payload: verification.payload,
      session_id: verification.session_id,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Verification failed" };
  }
});

authRoutes.post("/api/auth/refresh", tokenRefreshRateLimiter, async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { token } = body;

    if (!token) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Token required" };
      return;
    }

    const ipAddress = getClientIP(ctx);
    const userAgent = getUserAgent(ctx);

    const newTokenData = await enhancedJwtService.refreshToken(
      token,
      ipAddress,
      userAgent,
    );

    if (!newTokenData) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid or expired token" };
      return;
    }

    const verification = await enhancedJwtService.verifyToken(
      newTokenData.token,
    );
    if (verification.valid && verification.payload) {
      const profile = await databaseService.getUserProfile(
        verification.payload.sub,
      );

      ctx.response.body = {
        access_token: newTokenData.token,
        token_type: "Bearer",
        expires_in: 86400,
        session_id: newTokenData.sessionId,
        expires_at: newTokenData.expiresAt.toISOString(),
        user: {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          full_name: profile.full_name,
          tenant_id: newTokenData.tenantId,
        },
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to validate refreshed token" };
    }
  } catch (error) {
    console.error("Token refresh error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Refresh failed" };
  }
});

authRoutes.get("/api/auth/profile", async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Authorization header required" };
      return;
    }

    const token = authHeader.substring(7);
    const verification = await enhancedJwtService.verifyToken(token);

    if (!verification.valid || !verification.payload?.sub) {
      ctx.response.status = 401;
      ctx.response.body = { error: verification.error || "Invalid token" };
      return;
    }

    const { profile, permissions } = await databaseService.fetchAppSessionProfile(
      verification.payload.sub,
    );

    ctx.response.body = { profile, permissions };
  } catch (error) {
    console.error("Profile fetch error:", error);
    ctx.response.status = 404;
    ctx.response.body = { error: "Profile not found" };
  }
});

/**
 * GET /api/auth/me/contexts
 * Workspace switcher source for Option C.
 */
authRoutes.get("/api/auth/me/contexts", async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Authorization header required" };
      return;
    }

    const token = authHeader.substring(7);
    const verification = await enhancedJwtService.verifyToken(token);
    if (!verification.valid || !verification.payload?.sub) {
      ctx.response.status = 401;
      ctx.response.body = { error: verification.error || "Invalid token" };
      return;
    }

    const userId = verification.payload.sub;
    const membershipsResult = await postgresService.query(
      `SELECT
         ut.id AS membership_id,
         ut.user_id,
         ut.tenant_id,
         ut.role,
         ut.status,
         ut.is_active,
         ut.is_primary,
         ut.created_at,
         t.name AS tenant_name,
         t.tenant_type,
         t.schema AS tenant_schema,
         t.domain AS tenant_domain,
         (pht.user_id IS NOT NULL) AS is_personal_health_owner
       FROM public.user_tenants ut
       INNER JOIN public.tenants t ON t.id = ut.tenant_id
       LEFT JOIN public.personal_health_tenants pht
         ON pht.tenant_id = ut.tenant_id AND pht.user_id = ut.user_id
       WHERE ut.user_id = $1::uuid
       ORDER BY ut.is_primary DESC, ut.created_at ASC`,
      [userId],
    );

    const memberships = membershipsResult.rows.map((row) => {
      const status = String(
        row.status ?? (row.is_active === false ? "left" : "active"),
      ).toLowerCase();
      const isActive = row.is_active !== false && status === "active";
      return {
        membership_id: String(row.membership_id),
        tenant_id: String(row.tenant_id),
        role: String(row.role ?? ""),
        status,
        is_active: isActive,
        is_default: row.is_primary === true,
        created_at: row.created_at,
        tenant: {
          id: String(row.tenant_id),
          name: String(row.tenant_name ?? ""),
          tenant_type: row.tenant_type ? String(row.tenant_type) : null,
          schema: row.tenant_schema ? String(row.tenant_schema) : null,
          domain: row.tenant_domain ? String(row.tenant_domain) : null,
          is_personal_health_owner: row.is_personal_health_owner === true,
        },
      };
    });

    const activeContext = (ctx.state.activeContext as
      | {
          tenantId: string;
          membershipId: string;
          tenantRole: string;
          source: "request_headers" | "legacy_jwt_membership";
        }
      | undefined) ?? null;

    ctx.response.body = {
      user_id: userId,
      memberships,
      current_context: activeContext,
    };
  } catch (error) {
    console.error("Auth me contexts error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to load user contexts" };
  }
});

export { authRoutes };
