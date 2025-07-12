
import { postgresService } from "./postgresService.ts"
import { databaseService } from "./databaseService.ts"

export interface SessionRecord {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  created_at: string
  last_used: string
  ip_address?: string
  user_agent?: string
  is_active: boolean
}

export interface SecurityAuditLog {
  id: string
  user_id: string
  action: string
  ip_address?: string
  user_agent?: string
  details?: object
  created_at: string
}

export class SessionService {
  private async getCurrentSchema(): Promise<string> {
    try {
      const result = await databaseService.getCurrentSchemaInfo()
      return result?.current || 'public'
    } catch (error) {
      console.error('Error getting current schema:', error)
      return 'public'
    }
  }

  async createSession(userId: string, tokenHash: string, expiresAt: Date, ipAddress?: string, userAgent?: string): Promise<string> {
    const schema = await this.getCurrentSchema()
    const sessionId = crypto.randomUUID()
    
    try {
      await postgresService.query(
        `INSERT INTO ${schema}.jwt_sessions (id, user_id, token_hash, expires_at, ip_address, user_agent, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sessionId, userId, tokenHash, expiresAt.toISOString(), ipAddress, userAgent, true]
      )
      
      await this.logSecurityEvent(userId, 'SESSION_CREATED', ipAddress, userAgent, { session_id: sessionId })
      return sessionId
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  }

  async getActiveSession(tokenHash: string): Promise<SessionRecord | null> {
    const schema = await this.getCurrentSchema()
    
    try {
      const result = await postgresService.query(
        `SELECT * FROM ${schema}.jwt_sessions 
         WHERE token_hash = $1 AND is_active = true AND expires_at > NOW()`,
        [tokenHash]
      )
      
      return result.rows[0] || null
    } catch (error) {
      console.error('Error getting active session:', error)
      return null
    }
  }

  async updateSessionLastUsed(sessionId: string): Promise<void> {
    const schema = await this.getCurrentSchema()
    
    try {
      await postgresService.query(
        `UPDATE ${schema}.jwt_sessions SET last_used = NOW() WHERE id = $1`,
        [sessionId]
      )
    } catch (error) {
      console.error('Error updating session last used:', error)
    }
  }

  async deactivateSession(sessionId: string, userId: string, reason: string = 'LOGOUT'): Promise<void> {
    const schema = await this.getCurrentSchema()
    
    try {
      await postgresService.query(
        `UPDATE ${schema}.jwt_sessions SET is_active = false WHERE id = $1`,
        [sessionId]
      )
      
      await this.logSecurityEvent(userId, reason, undefined, undefined, { session_id: sessionId })
    } catch (error) {
      console.error('Error deactivating session:', error)
      throw error
    }
  }

  async deactivateAllUserSessions(userId: string, reason: string = 'LOGOUT_ALL'): Promise<void> {
    const schema = await this.getCurrentSchema()
    
    try {
      const result = await postgresService.query(
        `UPDATE ${schema}.jwt_sessions SET is_active = false 
         WHERE user_id = $1 AND is_active = true 
         RETURNING id`,
        [userId]
      )
      
      await this.logSecurityEvent(userId, reason, undefined, undefined, { 
        deactivated_sessions: result.rows.length 
      })
    } catch (error) {
      console.error('Error deactivating all user sessions:', error)
      throw error
    }
  }

  async blacklistToken(tokenHash: string, userId: string, reason: string = 'REVOKED'): Promise<void> {
    const schema = await this.getCurrentSchema()
    
    try {
      await postgresService.query(
        `INSERT INTO ${schema}.jwt_blacklist (token_hash, user_id, reason, blacklisted_at) 
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (token_hash) DO NOTHING`,
        [tokenHash, userId, reason]
      )
      
      await this.logSecurityEvent(userId, 'TOKEN_BLACKLISTED', undefined, undefined, { 
        token_hash: tokenHash.substring(0, 8) + '...', 
        reason 
      })
    } catch (error) {
      console.error('Error blacklisting token:', error)
      throw error
    }
  }

  async isTokenBlacklisted(tokenHash: string): Promise<boolean> {
    const schema = await this.getCurrentSchema()
    
    try {
      const result = await postgresService.query(
        `SELECT 1 FROM ${schema}.jwt_blacklist WHERE token_hash = $1`,
        [tokenHash]
      )
      
      return result.rows.length > 0
    } catch (error) {
      console.error('Error checking token blacklist:', error)
      return false
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    const schema = await this.getCurrentSchema()
    
    try {
      const result = await postgresService.query(
        `DELETE FROM ${schema}.jwt_sessions WHERE expires_at < NOW()`,
        []
      )
      
      console.log(`Cleaned up ${result.rowCount} expired sessions`)
      return result.rowCount || 0
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error)
      return 0
    }
  }

  async logSecurityEvent(userId: string, action: string, ipAddress?: string, userAgent?: string, details?: object): Promise<void> {
    const schema = await this.getCurrentSchema()
    
    try {
      await postgresService.query(
        `INSERT INTO ${schema}.security_audit_log (user_id, action, ip_address, user_agent, details) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, action, ipAddress, userAgent, details ? JSON.stringify(details) : null]
      )
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }

  async getUserSessions(userId: string): Promise<SessionRecord[]> {
    const schema = await this.getCurrentSchema()
    
    try {
      const result = await postgresService.query(
        `SELECT * FROM ${schema}.jwt_sessions 
         WHERE user_id = $1 AND is_active = true 
         ORDER BY last_used DESC`,
        [userId]
      )
      
      return result.rows
    } catch (error) {
      console.error('Error getting user sessions:', error)
      return []
    }
  }

  async getSecurityAuditLog(userId: string, limit: number = 50): Promise<SecurityAuditLog[]> {
    const schema = await this.getCurrentSchema()
    
    try {
      const result = await postgresService.query(
        `SELECT * FROM ${schema}.security_audit_log 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      )
      
      return result.rows
    } catch (error) {
      console.error('Error getting security audit log:', error)
      return []
    }
  }
}

export const sessionService = new SessionService()
