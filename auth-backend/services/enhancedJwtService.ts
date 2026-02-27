import * as jose from "https://deno.land/x/jose@v4.15.5/index.ts";
import { config } from "../config/env.ts";
import { sessionService } from "./sessionService.ts";
import { postgresService } from "./postgresService.ts";

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  tenant_id?: string;
  session_id?: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  jti?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: TokenPayload;
  session_id?: string;
  error?: string;
}

export class EnhancedJWTService {
  private secret: Uint8Array;

  constructor() {
    const secretString = config.JWT_SECRET;
    if (!secretString) {
      throw new Error("JWT_SECRET is required");
    }
    this.secret = new TextEncoder().encode(secretString);
  }

  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * ✅ FIX: Dynamic tenant_id lookup from user_tenants table
   */
  private async getTenantIdForUser(userId: string): Promise<string | null> {
    try {
      const result = await postgresService.query(
        "SELECT tenant_id FROM public.user_tenants WHERE user_id = $1 AND is_primary = true AND is_active = true LIMIT 1",
        [userId],
      );

      if (result.rows.length > 0) {
        console.log(
          "✅ Found primary tenant for user:",
          userId,
          "-> tenant_id:",
          result.rows[0].tenant_id,
        );
        return result.rows[0].tenant_id;
      }

      console.warn("⚠️ No primary tenant found for user:", userId);
      return null;
    } catch (error) {
      console.error("❌ Error looking up tenant for user:", userId, error);
      return null;
    }
  }

  /**
   * ✅ FIXED: Pass tenant_id to sessionService.createSession()
   */
  async createToken(
    userId: string,
    email: string,
    role: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    token: string;
    sessionId: string;
    expiresAt: Date;
    tenantId: string | null;
  }> {
    // ✅ Dynamically look up tenant_id
    const tenantId = await this.getTenantIdForUser(userId);

    if (!tenantId) {
      throw new Error("Cannot create session: user has no tenant assigned");
    }

    const sessionId = crypto.randomUUID();
    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const payload = {
      sub: userId,
      email: email,
      role: role,
      tenant_id: tenantId,
      session_id: sessionId,
      jti: jti,
      iss: "luxmed-auth",
      aud: "luxmed-app",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    console.log("🔐 Creating JWT token:", {
      userId,
      email,
      role,
      tenantId,
      sessionId,
    });

    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(this.secret);

    const tokenHash = await this.hashToken(token);

    // ✅ CRITICAL FIX: Pass tenantId to createSession!
    await sessionService.createSession(
      userId,
      tenantId,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    );

    try {
      const { tokenRotationService } =
        await import("./tokenRotationService.ts");
      await tokenRotationService.scheduleTokenRotation({
        userId,
        tokenHash,
        sessionId,
        expiresAt: expiresAt.toISOString(),
        rotationScheduledAt: new Date().toISOString(),
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error("Error scheduling token rotation:", error);
    }

    return { token, sessionId, expiresAt, tenantId };
  }

  async verifyToken(
    token: string,
    ipAddress?: string,
  ): Promise<TokenValidationResult> {
    try {
      const { payload } = await jose.jwtVerify(token, this.secret, {
        issuer: "luxmed-auth",
        audience: "luxmed-app",
      });

      const tokenHash = await this.hashToken(token);
      const tenantId = (payload as TokenPayload).tenant_id;

      const isBlacklisted = await sessionService.isTokenBlacklisted(
        tokenHash,
        tenantId,
      );
      if (isBlacklisted) {
        return { valid: false, error: "Token is blacklisted" };
      }

      const session = await sessionService.getActiveSession(
        tokenHash,
        tenantId,
      );
      if (!session) {
        return { valid: false, error: "Session not found or expired" };
      }

      if (session.session_id) {
        await sessionService.updateSessionLastUsed(
          session.session_id,
          tenantId,
        );
      }

      return {
        valid: true,
        payload: payload as TokenPayload,
        session_id: session.session_id,
      };
    } catch (error) {
      console.error("JWT verification error:", error);
      return { valid: false, error: error.message };
    }
  }

  async refreshToken(
    oldToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    token: string;
    sessionId: string;
    expiresAt: Date;
    tenantId: string | null;
  } | null> {
    const validation = await this.verifyToken(oldToken, ipAddress);

    if (!validation.valid || !validation.payload) {
      return null;
    }

    const { sub, email, role, tenant_id } = validation.payload;

    if (!tenant_id) {
      console.error("Cannot refresh token: no tenant_id in payload");
      return null;
    }

    const oldTokenHash = await this.hashToken(oldToken);
    await sessionService.blacklistToken(
      oldTokenHash,
      sub,
      tenant_id,
      "TOKEN_REFRESHED",
    );

    if (validation.session_id) {
      await sessionService.deactivateSession(
        validation.session_id,
        sub,
        tenant_id,
        "TOKEN_REFRESHED",
      );
    }

    const newTokenData = await this.createToken(
      sub,
      email,
      role,
      ipAddress,
      userAgent,
    );

    await sessionService.logSecurityEvent(
      sub,
      tenant_id,
      "TOKEN_REFRESHED",
      ipAddress,
      userAgent,
      {
        old_session_id: validation.session_id,
        new_session_id: newTokenData.sessionId,
      },
    );

    return newTokenData;
  }

  async revokeToken(
    token: string,
    userId?: string,
    reason: string = "USER_REVOKED",
  ): Promise<boolean> {
    try {
      const tokenHash = await this.hashToken(token);

      let tenantId: string | undefined;

      if (!userId) {
        const validation = await this.verifyToken(token);
        if (validation.valid && validation.payload) {
          userId = validation.payload.sub;
          tenantId = validation.payload.tenant_id;
        }
      }

      if (!userId) {
        return false;
      }

      // Look up tenant if not found
      if (!tenantId) {
        const tenant = await this.getTenantIdForUser(userId);
        if (!tenant) {
          console.error("Cannot revoke token: no tenant found for user");
          return false;
        }
        tenantId = tenant;
      }

      await sessionService.blacklistToken(tokenHash, userId, tenantId, reason);
      const session = await sessionService.getActiveSession(
        tokenHash,
        tenantId,
      );
      if (session) {
        await sessionService.deactivateSession(
          session.session_id,
          userId,
          tenantId,
          reason,
        );
      }

      return true;
    } catch (error) {
      console.error("Error revoking token:", error);
      return false;
    }
  }

  async revokeAllUserTokens(
    userId: string,
    reason: string = "SECURITY_REVOCATION",
  ): Promise<boolean> {
    try {
      const tenantId = await this.getTenantIdForUser(userId);
      if (!tenantId) {
        console.error("Cannot revoke tokens: no tenant found for user");
        return false;
      }

      const sessions = await sessionService.getUserSessions(userId, tenantId);

      for (const session of sessions) {
        await sessionService.blacklistToken(
          session.token_hash,
          userId,
          tenantId,
          reason,
        );
      }

      await sessionService.deactivateAllUserSessions(userId, tenantId, reason);
      return true;
    } catch (error) {
      console.error("Error revoking all user tokens:", error);
      return false;
    }
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      await sessionService.cleanupExpiredSessions();
      console.log("Token cleanup completed");
    } catch (error) {
      console.error("Error during token cleanup:", error);
    }
  }
}

export const enhancedJwtService = new EnhancedJWTService();
