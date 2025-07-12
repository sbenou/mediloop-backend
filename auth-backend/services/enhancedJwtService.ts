import * as jose from "https://deno.land/x/jose@v4.15.5/index.ts"
import { config } from "../config/env.ts"
import { sessionService } from "./sessionService.ts"
import { createHash } from "https://deno.land/std@0.208.0/crypto/mod.ts"

export interface TokenPayload {
  sub: string
  email: string
  role: string
  tenant_id?: string
  session_id?: string
  iss: string
  aud: string
  iat: number
  exp: number
  jti?: string
}

export interface TokenValidationResult {
  valid: boolean
  payload?: TokenPayload
  session_id?: string
  error?: string
}

export class EnhancedJWTService {
  private secret: Uint8Array

  constructor() {
    const secretString = config.JWT_SECRET
    if (!secretString) {
      throw new Error('JWT_SECRET is required')
    }
    this.secret = new TextEncoder().encode(secretString)
  }

  private hashToken(token: string): string {
    const hash = createHash("sha256")
    hash.update(token)
    return hash.toString("hex")
  }

  async createToken(
    userId: string, 
    email: string, 
    role: string, 
    tenantId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ token: string; sessionId: string; expiresAt: Date }> {
    const sessionId = crypto.randomUUID()
    const jti = crypto.randomUUID() // Unique token identifier
    const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hours
    
    const payload = {
      sub: userId,
      email: email,
      role: role,
      tenant_id: tenantId,
      session_id: sessionId,
      jti: jti,
      iss: 'luxmed-auth',
      aud: 'luxmed-app',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000)
    }

    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(this.secret)

    // Hash the token for storage
    const tokenHash = this.hashToken(token)
    
    // Create session record
    await sessionService.createSession(userId, tokenHash, expiresAt, ipAddress, userAgent)

    // Schedule automatic token rotation
    try {
      const { tokenRotationService } = await import('./tokenRotationService.ts')
      await tokenRotationService.scheduleTokenRotation({
        userId,
        tokenHash,
        sessionId,
        expiresAt: expiresAt.toISOString(),
        rotationScheduledAt: new Date().toISOString(),
        ipAddress,
        userAgent
      })
    } catch (error) {
      console.error('Error scheduling token rotation:', error)
      // Don't fail token creation if rotation scheduling fails
    }

    return { token, sessionId, expiresAt }
  }

  async verifyToken(token: string, ipAddress?: string): Promise<TokenValidationResult> {
    try {
      // First verify JWT signature and expiration
      const { payload } = await jose.jwtVerify(token, this.secret, {
        issuer: 'luxmed-auth',
        audience: 'luxmed-app'
      })

      const tokenHash = this.hashToken(token)

      // Check if token is blacklisted
      const isBlacklisted = await sessionService.isTokenBlacklisted(tokenHash)
      if (isBlacklisted) {
        return { valid: false, error: 'Token is blacklisted' }
      }

      // Check if session is active
      const session = await sessionService.getActiveSession(tokenHash)
      if (!session) {
        return { valid: false, error: 'Session not found or expired' }
      }

      // Update session last used
      if (session.id) {
        await sessionService.updateSessionLastUsed(session.id)
      }

      return { 
        valid: true, 
        payload: payload as TokenPayload,
        session_id: session.id 
      }
    } catch (error) {
      console.error('JWT verification error:', error)
      return { valid: false, error: error.message }
    }
  }

  async refreshToken(
    oldToken: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<{ token: string; sessionId: string; expiresAt: Date } | null> {
    const validation = await this.verifyToken(oldToken, ipAddress)
    
    if (!validation.valid || !validation.payload) {
      return null
    }

    const { sub, email, role, tenant_id } = validation.payload

    // Blacklist the old token
    const oldTokenHash = this.hashToken(oldToken)
    await sessionService.blacklistToken(oldTokenHash, sub, 'TOKEN_REFRESHED')

    // Deactivate old session
    if (validation.session_id) {
      await sessionService.deactivateSession(validation.session_id, sub, 'TOKEN_REFRESHED')
    }

    // Create new token and session
    const newTokenData = await this.createToken(sub, email, role, tenant_id, ipAddress, userAgent)
    
    await sessionService.logSecurityEvent(sub, 'TOKEN_REFRESHED', ipAddress, userAgent, {
      old_session_id: validation.session_id,
      new_session_id: newTokenData.sessionId
    })

    return newTokenData
  }

  async revokeToken(token: string, userId?: string, reason: string = 'USER_REVOKED'): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token)
      
      // If no userId provided, try to get it from token
      if (!userId) {
        const validation = await this.verifyToken(token)
        if (validation.valid && validation.payload) {
          userId = validation.payload.sub
        }
      }

      if (!userId) {
        return false
      }

      // Blacklist the token
      await sessionService.blacklistToken(tokenHash, userId, reason)

      // Find and deactivate the session
      const session = await sessionService.getActiveSession(tokenHash)
      if (session) {
        await sessionService.deactivateSession(session.id, userId, reason)
      }

      return true
    } catch (error) {
      console.error('Error revoking token:', error)
      return false
    }
  }

  async revokeAllUserTokens(userId: string, reason: string = 'SECURITY_REVOCATION'): Promise<boolean> {
    try {
      // Get all active sessions for user
      const sessions = await sessionService.getUserSessions(userId)
      
      // Blacklist all tokens
      for (const session of sessions) {
        await sessionService.blacklistToken(session.token_hash, userId, reason)
      }

      // Deactivate all sessions
      await sessionService.deactivateAllUserSessions(userId, reason)

      return true
    } catch (error) {
      console.error('Error revoking all user tokens:', error)
      return false
    }
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      await sessionService.cleanupExpiredSessions()
      console.log('Token cleanup completed')
    } catch (error) {
      console.error('Error during token cleanup:', error)
    }
  }
}

export const enhancedJwtService = new EnhancedJWTService()
