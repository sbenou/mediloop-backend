import { Router } from "oak";
import { enhancedJwtService } from "../services/enhancedJwtService.ts";
import { databaseService } from "../services/databaseService.ts";
import { registrationService } from "../services/registrationService.ts";
import { kvStore } from "../services/kvStore.ts";
import {
  loginRateLimiter,
  registrationRateLimiter,
  tokenRefreshRateLimiter,
} from "../middleware/rateLimitMiddleware.ts";

const authRoutes = new Router();

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

    if (!email || !password || !fullName) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Email, password, and full name are required",
      };
      return;
    }

    const ipAddress = getClientIP(ctx);
    const userAgent = getUserAgent(ctx);

    console.log(
      "V3 Registration: Attempting registration for:",
      email,
      "with role:",
      role,
    );

    const profile = await registrationService.registerUser(
      email,
      password,
      fullName,
      role,
      workplaceName,
      pharmacyName,
    );

    // ✅ FIX: tenant_id is now automatically determined
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

    console.log("V3 Registration: Registration successful for:", email);

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
      },
    };
  } catch (error) {
    console.error("V3 Registration error:", error);
    ctx.response.status = 400;
    ctx.response.body = { error: error.message || "Registration failed" };
  }
});

// ✅ FIX: Simplified login - removed 60+ lines of brittle code
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
      },
    };
  } catch (error) {
    console.error("V3 Login error:", error);

    let errorMessage = "Login failed";
    if (error.message.includes("Invalid login credentials")) {
      errorMessage =
        "Invalid email or password. Please check your credentials.";
    } else if (error.message.includes("Profile not found")) {
      errorMessage =
        "No account found with this email address. Please sign up first.";
    }

    ctx.response.status = 401;
    ctx.response.body = { error: errorMessage };
  }
});

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

    if (!verification.valid) {
      ctx.response.status = 401;
      ctx.response.body = { error: verification.error || "Invalid token" };
      return;
    }

    // ✅ FIX: Get user from auth.users (not tenant schema!)
    const user = await databaseService.getUserByEmail(
      verification.payload.email,
    );

    ctx.response.body = {
      profile: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    };
  } catch (error) {
    console.error("Profile fetch error:", error);
    ctx.response.status = 404;
    ctx.response.body = { error: "Profile not found" };
  }
});

export { authRoutes };
