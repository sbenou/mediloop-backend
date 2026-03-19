import { postgresService } from "../../../shared/services/postgresService.ts";

export interface SessionRecord {
  id: string;
  tenant_id: string;
  user_id: string;
  session_id: string;
  token_hash: string;
  refresh_token_hash?: string;
  device_info?: any;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  last_activity: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityAuditLog {
  id: string;
  user_id: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  details?: object;
  created_at: string;
}

/**
 * ✅ FIXED: Session Service for partitioned auth.jwt_sessions table
 *
 * Schema: auth.jwt_sessions
 * Partitioning: HASH(tenant_id) with 4 partitions
 *
 * CRITICAL: tenant_id is NOT NULL and is the partition key!
 * CRITICAL: session_id is NOT NULL (different from id)
 */
export class SessionService {
  private readonly AUTH_SCHEMA = "auth";

  /**
   * ✅ FIXED: Added tenant_id parameter (required for partitioning!)
   */
  async createSession(
    userId: string,
    tenantId: string,
    tokenHash: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const sessionId = crypto.randomUUID();

    try {
      // ✅ Insert with ALL required columns including tenant_id
      await postgresService.query(
        `INSERT INTO ${this.AUTH_SCHEMA}.jwt_sessions 
         (tenant_id, user_id, session_id, token_hash, expires_at, ip_address, user_agent, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          tenantId,
          userId,
          sessionId,
          tokenHash,
          expiresAt.toISOString(),
          ipAddress,
          userAgent,
          true,
        ],
      );

      await this.logSecurityEvent(
        userId,
        tenantId,
        "SESSION_CREATED",
        ipAddress,
        userAgent,
        { session_id: sessionId },
      );
      return sessionId;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Added tenant_id to query
   */
  async getActiveSession(
    tokenHash: string,
    tenantId?: string,
  ): Promise<SessionRecord | null> {
    try {
      let query = `SELECT * FROM ${this.AUTH_SCHEMA}.jwt_sessions 
                   WHERE token_hash = $1 AND is_active = true AND expires_at > NOW()`;
      const params: any[] = [tokenHash];

      // If tenant_id provided, use it for better partition pruning
      if (tenantId) {
        query += ` AND tenant_id = $2`;
        params.push(tenantId);
      }

      const result = await postgresService.query(query, params);

      return result.rows[0] || null;
    } catch (error) {
      console.error("Error getting active session:", error);
      return null;
    }
  }

  /**
   * ✅ FIXED: Update by session_id (the unique identifier)
   */
  async updateSessionLastUsed(
    sessionId: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      let query = `UPDATE ${this.AUTH_SCHEMA}.jwt_sessions 
                   SET last_activity = NOW(), updated_at = NOW() 
                   WHERE session_id = $1`;
      const params: any[] = [sessionId];

      if (tenantId) {
        query += ` AND tenant_id = $2`;
        params.push(tenantId);
      }

      await postgresService.query(query, params);
    } catch (error) {
      console.error("Error updating session last used:", error);
    }
  }

  /**
   * ✅ FIXED: Deactivate by session_id with tenant_id
   */
  async deactivateSession(
    sessionId: string,
    userId: string,
    tenantId: string,
    reason: string = "LOGOUT",
  ): Promise<void> {
    try {
      await postgresService.query(
        `UPDATE ${this.AUTH_SCHEMA}.jwt_sessions 
         SET is_active = false, updated_at = NOW() 
         WHERE session_id = $1 AND tenant_id = $2`,
        [sessionId, tenantId],
      );

      await this.logSecurityEvent(
        userId,
        tenantId,
        reason,
        undefined,
        undefined,
        { session_id: sessionId },
      );
    } catch (error) {
      console.error("Error deactivating session:", error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Deactivate all sessions with tenant_id
   */
  async deactivateAllUserSessions(
    userId: string,
    tenantId: string,
    reason: string = "LOGOUT_ALL",
  ): Promise<void> {
    try {
      const result = await postgresService.query(
        `UPDATE ${this.AUTH_SCHEMA}.jwt_sessions 
         SET is_active = false, updated_at = NOW() 
         WHERE user_id = $1 AND tenant_id = $2 AND is_active = true 
         RETURNING session_id`,
        [userId, tenantId],
      );

      await this.logSecurityEvent(
        userId,
        tenantId,
        reason,
        undefined,
        undefined,
        {
          deactivated_sessions: result.rows.length,
        },
      );
    } catch (error) {
      console.error("Error deactivating all user sessions:", error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Added tenant_id parameter
   */
  async blacklistToken(
    tokenHash: string,
    userId: string,
    tenantId: string,
    reason: string = "REVOKED",
  ): Promise<void> {
    try {
      await postgresService.query(
        `INSERT INTO ${this.AUTH_SCHEMA}.jwt_blacklist (tenant_id, token_hash, user_id, reason, blacklisted_at) 
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (tenant_id, token_hash) DO NOTHING`,
        [tenantId, tokenHash, userId, reason],
      );

      await this.logSecurityEvent(
        userId,
        tenantId,
        "TOKEN_BLACKLISTED",
        undefined,
        undefined,
        {
          token_hash: tokenHash.substring(0, 8) + "...",
          reason,
        },
      );
    } catch (error) {
      console.error("Error blacklisting token:", error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Check blacklist with tenant_id
   */
  async isTokenBlacklisted(
    tokenHash: string,
    tenantId?: string,
  ): Promise<boolean> {
    try {
      let query = `SELECT 1 FROM ${this.AUTH_SCHEMA}.jwt_blacklist WHERE token_hash = $1`;
      const params: any[] = [tokenHash];

      if (tenantId) {
        query += ` AND tenant_id = $2`;
        params.push(tenantId);
      }

      const result = await postgresService.query(query, params);

      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking token blacklist:", error);
      return false;
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await postgresService.query(
        `DELETE FROM ${this.AUTH_SCHEMA}.jwt_sessions WHERE expires_at < NOW()`,
        [],
      );

      console.log(`Cleaned up ${result.rowCount} expired sessions`);
      return result.rowCount || 0;
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
      return 0;
    }
  }

  /**
   * ✅ FIXED: Added tenant_id parameter
   */
  async logSecurityEvent(
    userId: string,
    tenantId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string,
    details?: object,
  ): Promise<void> {
    try {
      await postgresService.query(
        `INSERT INTO ${this.AUTH_SCHEMA}.security_audit_log 
         (tenant_id, user_id, action, ip_address, user_agent, details) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tenantId,
          userId,
          action,
          ipAddress,
          userAgent,
          details ? JSON.stringify(details) : null,
        ],
      );
    } catch (error) {
      console.error("Error logging security event:", error);
      // Don't throw - logging failures shouldn't break the main flow
    }
  }

  /**
   * ✅ FIXED: Get sessions with tenant_id
   */
  async getUserSessions(
    userId: string,
    tenantId: string,
  ): Promise<SessionRecord[]> {
    try {
      const result = await postgresService.query(
        `SELECT * FROM ${this.AUTH_SCHEMA}.jwt_sessions 
         WHERE user_id = $1 AND tenant_id = $2 AND is_active = true 
         ORDER BY last_activity DESC`,
        [userId, tenantId],
      );

      return result.rows;
    } catch (error) {
      console.error("Error getting user sessions:", error);
      return [];
    }
  }

  /**
   * ✅ FIXED: Get audit log with tenant_id
   */
  async getSecurityAuditLog(
    userId: string,
    tenantId: string,
    limit: number = 50,
  ): Promise<SecurityAuditLog[]> {
    try {
      const result = await postgresService.query(
        `SELECT * FROM ${this.AUTH_SCHEMA}.security_audit_log 
         WHERE user_id = $1 AND tenant_id = $2 
         ORDER BY created_at DESC 
         LIMIT $3`,
        [userId, tenantId, limit],
      );

      return result.rows;
    } catch (error) {
      console.error("Error getting security audit log:", error);
      return [];
    }
  }
}

export const sessionService = new SessionService();
