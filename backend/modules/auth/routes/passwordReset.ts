import { Router } from "oak";
import { enhancedJwtService } from "../../auth/services/enhancedJwtService.ts";
import { databaseService } from "../../../shared/services/databaseService.ts";
import { updatedEmailService } from "../../../shared/services/updatedEmailService.ts";
import { smsService } from "../../../shared/services/smsService.ts";
import { kvStore } from "../../../shared/services/kvStore.ts";
import {
  passwordResetRateLimiter,
  otpRateLimiter,
  otpVerifyRateLimiter,
  tokenVerifyRateLimiter,
} from "../../../shared/middleware/rateLimitMiddleware.ts";

const passwordResetRoutes = new Router();

// Type definitions for password reset data
interface OTPData {
  otp: string;
  identifier: string; // Can be email or phone
  identifierType: "email" | "phone";
  email: string; // Always store email for password update
  expiresAt: string;
  attempts: number;
}

interface TokenData {
  email: string;
  userId: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get client IP helper
function getClientIP(ctx: any): string {
  const forwarded = ctx.request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return ctx.request.ip || "unknown";
}

// Helper to get user by email or phone
async function getUserByIdentifier(
  email?: string,
  phone?: string,
): Promise<{ user: any; email: string; identifierType: "email" | "phone" }> {
  if (email) {
    const user = await databaseService.getUserByEmail(email);
    return { user, email, identifierType: "email" };
  }

  if (phone) {
    const user = await databaseService.getUserByPhone(phone);
    // User found by phone, get their email for password reset
    return { user, email: user.email, identifierType: "phone" };
  }

  throw new Error("No identifier provided");
}

// Helper to send OTP via appropriate channel
async function sendOTP(
  identifierType: "email" | "phone",
  identifier: string,
  otp: string,
): Promise<void> {
  if (identifierType === "email") {
    await updatedEmailService.sendLoginCode(identifier, otp);
    console.log("Password reset OTP sent via email to:", identifier);
  } else if (identifierType === "phone") {
    // ✅ NOW USING REAL SMS SERVICE
    await smsService.sendOTP(identifier, otp);
    console.log("Password reset OTP sent via SMS to:", identifier);
  }
}

// Request password reset with OTP (supports both email and phone)
passwordResetRoutes.post(
  "/api/auth/request-password-reset-otp",
  otpRateLimiter,
  async (ctx) => {
    try {
      const body = await ctx.request.body({ type: "json" }).value;
      const { email, phone } = body;

      // Validate that at least one identifier is provided
      if (!email && !phone) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Email or phone number is required" };
        return;
      }

      const identifier = email || phone;
      const identifierType: "email" | "phone" = email ? "email" : "phone";

      console.log(
        `Password reset OTP requested via ${identifierType}:`,
        identifier,
      );

      // Check if user exists
      let userEmail: string;
      try {
        const result = await getUserByIdentifier(email, phone);
        userEmail = result.email;
      } catch (error) {
        console.log("User not found for password reset:", identifier);
        // Return success anyway for security (don't reveal if user exists)
        ctx.response.body = {
          success: true,
          message:
            "If an account exists with this information, you will receive a password reset code.",
        };
        return;
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store OTP in KV store using the identifier (email or phone)
      const otpKey = ["password_reset_otp", identifier];
      await kvStore.set(
        otpKey,
        {
          otp,
          identifier,
          identifierType,
          email: userEmail, // Store email for password update later
          expiresAt: expiresAt.toISOString(),
          attempts: 0,
        } as OTPData,
        { expireIn: 15 * 60 * 1000 },
      ); // 15 minutes TTL

      // Send OTP via appropriate channel
      try {
        await sendOTP(identifierType, identifier, otp);
      } catch (error) {
        console.error("Failed to send password reset OTP:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to send password reset code" };
        return;
      }

      ctx.response.body = {
        success: true,
        message: `Password reset code sent to your ${identifierType}`,
      };
    } catch (error) {
      console.error("Password reset OTP request error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  },
);

// Verify OTP and reset password (supports both email and phone)
passwordResetRoutes.post(
  "/api/auth/reset-password-with-otp",
  otpVerifyRateLimiter,
  async (ctx) => {
    try {
      const body = await ctx.request.body({ type: "json" }).value;
      const { email, phone, otp, newPassword } = body;

      // Validate inputs
      if ((!email && !phone) || !otp || !newPassword) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: "Email or phone, OTP, and new password are required",
        };
        return;
      }

      const identifier = email || phone;
      console.log("Password reset with OTP attempted for:", identifier);

      // Get stored OTP
      const otpKey = ["password_reset_otp", identifier];
      const storedData = await kvStore.get<OTPData>(otpKey);

      if (!storedData) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Invalid or expired OTP" };
        return;
      }

      // Check attempts
      if (storedData.attempts >= 3) {
        await kvStore.delete(["password_reset_otp", identifier]);
        ctx.response.status = 400;
        ctx.response.body = {
          error: "Too many attempts. Please request a new code.",
        };
        return;
      }

      // Verify OTP
      if (storedData.otp !== otp) {
        // Increment attempts
        await kvStore.set(
          ["password_reset_otp", identifier],
          {
            ...storedData,
            attempts: storedData.attempts + 1,
          },
          { expireIn: 15 * 60 * 1000 },
        );

        ctx.response.status = 400;
        ctx.response.body = { error: "Invalid OTP" };
        return;
      }

      // Check expiration
      if (new Date() > new Date(storedData.expiresAt)) {
        await kvStore.delete(["password_reset_otp", identifier]);
        ctx.response.status = 400;
        ctx.response.body = { error: "OTP has expired" };
        return;
      }

      // Update password using the stored email
      const userEmail = storedData.email;

      try {
        await databaseService.updateUserPassword(userEmail, newPassword);
        await kvStore.delete(["password_reset_otp", identifier]); // Clean up OTP

        console.log("Password reset successful for:", userEmail);

        // Revoke all existing tokens for security
        const user = await databaseService.getUserByEmail(userEmail);
        await enhancedJwtService.revokeAllUserTokens(user.id, "PASSWORD_RESET");

        ctx.response.body = {
          success: true,
          message: "Password reset successful",
        };
      } catch (error) {
        console.error("Failed to update password:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to update password" };
      }
    } catch (error) {
      console.error("Password reset with OTP error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  },
);

// Request password reset with email link (email only)
passwordResetRoutes.post(
  "/api/auth/request-password-reset-link",
  passwordResetRateLimiter,
  async (ctx) => {
    try {
      const body = await ctx.request.body({ type: "json" }).value;
      const { email } = body;

      if (!email) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Email is required" };
        return;
      }

      console.log("Password reset link requested for:", email);

      // Check if user exists
      let user;
      try {
        user = await databaseService.getUserByEmail(email);
      } catch (error) {
        console.log("User not found for password reset:", email);
        // Return success anyway for security
        ctx.response.body = {
          success: true,
          message:
            "If an account exists with this email, you will receive a password reset link.",
        };
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      const tokenKey = ["password_reset_token", resetToken];
      await kvStore.set(
        tokenKey,
        {
          email,
          userId: user.id,
          expiresAt: expiresAt.toISOString(),
          used: false,
        } as TokenData,
        { expireIn: 60 * 60 * 1000 },
      ); // 1 hour TTL

      // Create reset URL
      const resetUrl = `${Deno.env.get("FRONTEND_URL") || "http://localhost:5173"}/reset-password/new?token=${resetToken}&email=${encodeURIComponent(email)}`;

      // Send reset email
      try {
        await updatedEmailService.sendPasswordReset(email, resetUrl);
        console.log("Password reset link sent to:", email);
      } catch (error) {
        console.error("Failed to send password reset email:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to send password reset email" };
        return;
      }

      ctx.response.body = {
        success: true,
        message: "Password reset link sent to your email",
      };
    } catch (error) {
      console.error("Password reset link request error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  },
);

// Reset password with token (from email link)
passwordResetRoutes.post(
  "/api/auth/reset-password-with-token",
  tokenVerifyRateLimiter,
  async (ctx) => {
    try {
      const body = await ctx.request.body({ type: "json" }).value;
      const { token, newPassword } = body;

      if (!token || !newPassword) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Token and new password are required" };
        return;
      }

      console.log("Password reset with token attempted");

      // Get stored token data
      const tokenKey = ["password_reset_token", token];
      const tokenData = await kvStore.get<TokenData>(tokenKey);

      if (!tokenData) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Invalid or expired reset token" };
        return;
      }

      // Check if token was already used
      if (tokenData.used) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Reset token has already been used" };
        return;
      }

      // Check expiration
      if (new Date() > new Date(tokenData.expiresAt)) {
        await kvStore.delete(["password_reset_token", token]);
        ctx.response.status = 400;
        ctx.response.body = { error: "Reset token has expired" };
        return;
      }

      // Update password
      try {
        await databaseService.updateUserPassword(tokenData.email, newPassword);

        // Mark token as used
        await kvStore.set(
          ["password_reset_token", token],
          {
            ...tokenData,
            used: true,
            usedAt: new Date().toISOString(),
          },
          { expireIn: 60 * 60 * 1000 },
        );

        console.log("Password reset successful for:", tokenData.email);

        // Revoke all existing tokens for security
        await enhancedJwtService.revokeAllUserTokens(
          tokenData.userId,
          "PASSWORD_RESET",
        );

        ctx.response.body = {
          success: true,
          message: "Password reset successful",
        };
      } catch (error) {
        console.error("Failed to update password:", error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to update password" };
      }
    } catch (error) {
      console.error("Password reset with token error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  },
);

// Verify reset token (for frontend validation)
passwordResetRoutes.get("/api/auth/verify-reset-token/:token", async (ctx) => {
  try {
    const token = ctx.params.token;

    if (!token) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Token is required" };
      return;
    }

    // Get stored token data
    const tokenData = await kvStore.get<TokenData>([
      "password_reset_token",
      token,
    ]);

    if (!tokenData) {
      ctx.response.status = 400;
      ctx.response.body = { valid: false, error: "Invalid token" };
      return;
    }

    // Check if token was already used
    if (tokenData.used) {
      ctx.response.status = 400;
      ctx.response.body = { valid: false, error: "Token already used" };
      return;
    }

    // Check expiration
    if (new Date() > new Date(tokenData.expiresAt)) {
      await kvStore.delete(["password_reset_token", token]);
      ctx.response.status = 400;
      ctx.response.body = { valid: false, error: "Token expired" };
      return;
    }

    ctx.response.body = {
      valid: true,
      email: tokenData.email,
      expiresAt: tokenData.expiresAt,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

export { passwordResetRoutes };
