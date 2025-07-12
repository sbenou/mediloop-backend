
import { enhancedJwtService } from "./enhancedJwtService.ts"
import { sessionService } from "./sessionService.ts"

export interface TokenRotationEntry {
  userId: string
  tokenHash: string
  sessionId: string
  expiresAt: string
  rotationScheduledAt: string
  ipAddress?: string
  userAgent?: string
}

export class TokenRotationService {
  private kv: Deno.Kv | null = null

  async initialize() {
    if (!this.kv) {
      this.kv = await Deno.openKv()
    }
    return this.kv
  }

  // Schedule a token for automatic rotation (80% of TTL)
  async scheduleTokenRotation(entry: TokenRotationEntry): Promise<void> {
    const kv = await this.initialize()
    
    const expiresAt = new Date(entry.expiresAt)
    const createdAt = new Date()
    const ttlMs = expiresAt.getTime() - createdAt.getTime()
    
    // Schedule rotation at 80% of token lifetime
    const rotationTime = new Date(createdAt.getTime() + (ttlMs * 0.8))
    
    const rotationEntry = {
      ...entry,
      rotationScheduledAt: rotationTime.toISOString()
    }

    // Store with rotation time as part of key for easy querying
    const rotationKey = ['token_rotation', rotationTime.getTime().toString(), entry.sessionId]
    await kv.set(rotationKey, rotationEntry)

    console.log(`[TokenRotation] Scheduled rotation for session ${entry.sessionId} at ${rotationTime.toISOString()}`)
  }

  // Get tokens that need rotation (past their scheduled time)
  async getTokensForRotation(): Promise<TokenRotationEntry[]> {
    const kv = await this.initialize()
    const now = Date.now()
    const tokensToRotate: TokenRotationEntry[] = []

    // Query all rotation entries up to current time
    const entries = kv.list<TokenRotationEntry>({ prefix: ['token_rotation'] })
    
    for await (const entry of entries) {
      const [, timestamp] = entry.key as [string, string, string]
      
      if (parseInt(timestamp) <= now) {
        tokensToRotate.push(entry.value)
      }
    }

    return tokensToRotate
  }

  // Perform automatic token rotation
  async rotateToken(entry: TokenRotationEntry): Promise<boolean> {
    try {
      console.log(`[TokenRotation] Starting automatic rotation for session ${entry.sessionId}`)

      // Verify the session is still active
      const activeSession = await sessionService.getActiveSession(entry.tokenHash)
      if (!activeSession) {
        console.log(`[TokenRotation] Session ${entry.sessionId} is no longer active, skipping rotation`)
        await this.removeRotationEntry(entry.sessionId)
        return false
      }

      // Create new token
      const profile = await this.getUserProfile(entry.userId)
      if (!profile) {
        console.log(`[TokenRotation] User profile not found for ${entry.userId}, skipping rotation`)
        return false
      }

      const newTokenData = await enhancedJwtService.createToken(
        entry.userId,
        profile.email,
        profile.role,
        profile.tenant_id,
        entry.ipAddress,
        entry.userAgent
      )

      // Blacklist old token
      await enhancedJwtService.revokeToken(`dummy_token_${entry.tokenHash}`, entry.userId, 'AUTO_ROTATED')

      // Store the new token rotation schedule
      await this.scheduleTokenRotation({
        userId: entry.userId,
        tokenHash: this.hashToken(newTokenData.token),
        sessionId: newTokenData.sessionId,
        expiresAt: newTokenData.expiresAt.toISOString(),
        rotationScheduledAt: new Date().toISOString(),
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent
      })

      // Store the new token for client retrieval
      await this.storeRotatedToken(entry.userId, newTokenData.token, newTokenData.expiresAt)

      // Clean up old rotation entry
      await this.removeRotationEntry(entry.sessionId)

      console.log(`[TokenRotation] Successfully rotated token for session ${entry.sessionId}`)
      return true
    } catch (error) {
      console.error(`[TokenRotation] Error rotating token for session ${entry.sessionId}:`, error)
      return false
    }
  }

  // Store rotated token for client to retrieve
  async storeRotatedToken(userId: string, newToken: string, expiresAt: Date): Promise<void> {
    const kv = await this.initialize()
    
    const rotatedTokenInfo = {
      token: newToken,
      expiresAt: expiresAt.toISOString(),
      rotatedAt: new Date().toISOString()
    }

    // Store with 5-minute expiry for client to retrieve
    await kv.set(['rotated_tokens', userId], rotatedTokenInfo, { expireIn: 300000 })
  }

  // Client endpoint to get rotated token
  async getRotatedToken(userId: string): Promise<{ token: string; expiresAt: string; rotatedAt: string } | null> {
    const kv = await this.initialize()
    const result = await kv.get<{ token: string; expiresAt: string; rotatedAt: string }>(['rotated_tokens', userId])
    return result.value
  }

  // Remove rotation entry after processing
  async removeRotationEntry(sessionId: string): Promise<void> {
    const kv = await this.initialize()
    
    // Need to find and delete the entry by sessionId
    const entries = kv.list<TokenRotationEntry>({ prefix: ['token_rotation'] })
    
    for await (const entry of entries) {
      if (entry.value.sessionId === sessionId) {
        await kv.delete(entry.key)
        break
      }
    }
  }

  // Clean up expired rotation entries
  async cleanupExpiredEntries(): Promise<number> {
    const kv = await this.initialize()
    const now = Date.now()
    let cleaned = 0

    const entries = kv.list<TokenRotationEntry>({ prefix: ['token_rotation'] })
    
    for await (const entry of entries) {
      const expiresAt = new Date(entry.value.expiresAt).getTime()
      
      // Clean up entries for tokens that have already expired
      if (expiresAt < now) {
        await kv.delete(entry.key)
        cleaned++
      }
    }

    console.log(`[TokenRotation] Cleaned up ${cleaned} expired rotation entries`)
    return cleaned
  }

  // Helper methods
  private hashToken(token: string): string {
    // Simple hash for demo - in production use crypto
    return btoa(token).substring(0, 32)
  }

  private async getUserProfile(userId: string): Promise<{ email: string; role: string; tenant_id?: string } | null> {
    try {
      const { databaseService } = await import('./databaseService.ts')
      const profile = await databaseService.getUserProfile(userId)
      return profile
    } catch (error) {
      console.error('[TokenRotation] Error fetching user profile:', error)
      return null
    }
  }

  // Run automatic rotation process
  async processScheduledRotations(): Promise<void> {
    console.log('[TokenRotation] Starting scheduled rotation process')
    
    try {
      const tokensToRotate = await this.getTokensForRotation()
      console.log(`[TokenRotation] Found ${tokensToRotate.length} tokens for rotation`)

      for (const entry of tokensToRotate) {
        await this.rotateToken(entry)
        // Small delay between rotations to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Clean up expired entries
      await this.cleanupExpiredEntries()
    } catch (error) {
      console.error('[TokenRotation] Error in scheduled rotation process:', error)
    }
  }
}

export const tokenRotationService = new TokenRotationService()
