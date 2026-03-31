
import { enhancedJwtService } from "./enhancedJwtService.ts"
import { sessionService } from "./sessionService.ts"
import { postgresService } from "../../../shared/services/postgresService.ts"

export interface TokenRotationEntry {
  userId: string
  tokenHash: string
  sessionId: string
  expiresAt: string
  rotationScheduledAt: string
  ipAddress?: string
  userAgent?: string
  failedAttempts?: number
  nextAttemptAt?: string
  lastError?: string
}

export interface TokenRotationQueueItem {
  keyTimestamp: number
  sessionId: string
  userId: string
  expiresAt: string
  nextAttemptAt: string
  failedAttempts: number
  lastError?: string
}

export class TokenRotationService {
  private kv: Deno.Kv | null = null
  private readonly MAX_FAILED_ATTEMPTS = 5
  private readonly RETRY_BASE_MS = 60_000
  private readonly RETRY_MAX_MS = 30 * 60_000

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
      rotationScheduledAt: rotationTime.toISOString(),
      failedAttempts: 0,
      nextAttemptAt: rotationTime.toISOString(),
      lastError: undefined,
    }

    // Store with rotation time as part of key for easy querying
    const rotationKey = ['token_rotation', rotationTime.getTime().toString(), entry.sessionId]
    await kv.set(rotationKey, rotationEntry)

    console.log(`[TokenRotation] Scheduled rotation for session ${entry.sessionId} at ${rotationTime.toISOString()}`)
  }

  // Get tokens that need rotation (past their scheduled time)
  async getTokensForRotation(): Promise<Array<{ key: Deno.KvKey; value: TokenRotationEntry }>> {
    const kv = await this.initialize()
    const now = Date.now()
    const tokensToRotate: Array<{ key: Deno.KvKey; value: TokenRotationEntry }> = []

    // Query all rotation entries up to current time
    const entries = kv.list<TokenRotationEntry>({ prefix: ['token_rotation'] })
    
    for await (const entry of entries) {
      const [, timestamp] = entry.key as [string, string, string]
      const failedAttempts = entry.value.failedAttempts ?? 0
      if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        await kv.delete(entry.key)
        console.warn(`[TokenRotation] Dropped rotation entry after ${failedAttempts} failed attempts for session ${entry.value.sessionId}`)
        continue
      }

      const dueAt = entry.value.nextAttemptAt
        ? new Date(entry.value.nextAttemptAt).getTime()
        : parseInt(timestamp)

      if (!Number.isFinite(dueAt)) {
        await kv.delete(entry.key)
        console.warn(`[TokenRotation] Dropped malformed rotation entry for session ${entry.value.sessionId}`)
        continue
      }

      if (dueAt <= now) {
        tokensToRotate.push({ key: entry.key, value: entry.value })
      }
    }

    return tokensToRotate
  }

  // Perform automatic token rotation
  async rotateToken(queueEntry: { key: Deno.KvKey; value: TokenRotationEntry }): Promise<boolean> {
    const entry = queueEntry.value
    try {
      console.log(`[TokenRotation] Starting automatic rotation for session ${entry.sessionId}`)

      // Verify the session is still active
      const activeSession = await sessionService.getActiveSession(entry.tokenHash)
      if (!activeSession) {
        console.log(`[TokenRotation] Session ${entry.sessionId} is no longer active, skipping rotation`)
        await this.removeRotationEntryByKey(queueEntry.key)
        return false
      }

      // Create new token
      const profile = await this.getUserProfile(entry.userId)
      if (!profile) {
        await this.markRotationFailure(queueEntry, "profile_not_found")
        console.log(`[TokenRotation] User profile not found for ${entry.userId}, scheduled retry`)
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
      await this.removeRotationEntryByKey(queueEntry.key)

      console.log(`[TokenRotation] Successfully rotated token for session ${entry.sessionId}`)
      return true
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      await this.markRotationFailure(queueEntry, errMsg)
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

  private async removeRotationEntryByKey(key: Deno.KvKey): Promise<void> {
    const kv = await this.initialize()
    await kv.delete(key)
  }

  private async markRotationFailure(
    queueEntry: { key: Deno.KvKey; value: TokenRotationEntry },
    reason: string,
  ): Promise<void> {
    const kv = await this.initialize()
    const attempts = (queueEntry.value.failedAttempts ?? 0) + 1
    if (attempts >= this.MAX_FAILED_ATTEMPTS) {
      await kv.delete(queueEntry.key)
      console.warn(
        `[TokenRotation] Giving up rotation for session ${queueEntry.value.sessionId} after ${attempts} failed attempts (last_error=${reason})`,
      )
      return
    }
    const backoffMs = Math.min(
      this.RETRY_BASE_MS * (2 ** (attempts - 1)),
      this.RETRY_MAX_MS,
    )
    const nextAttemptAt = new Date(Date.now() + backoffMs).toISOString()
    await kv.set(queueEntry.key, {
      ...queueEntry.value,
      failedAttempts: attempts,
      nextAttemptAt,
      lastError: reason,
    })
    console.warn(
      `[TokenRotation] Rotation failed for session ${queueEntry.value.sessionId}; retry ${attempts}/${this.MAX_FAILED_ATTEMPTS - 1} scheduled at ${nextAttemptAt}`,
    )
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

  // Read-only queue health snapshot for admin diagnostics.
  async getRotationQueueSnapshot(limit = 200): Promise<TokenRotationQueueItem[]> {
    const kv = await this.initialize()
    const out: TokenRotationQueueItem[] = []
    const entries = kv.list<TokenRotationEntry>({ prefix: ['token_rotation'] })
    for await (const entry of entries) {
      const [, timestamp] = entry.key as [string, string, string]
      const keyTimestamp = Number.parseInt(timestamp)
      out.push({
        keyTimestamp: Number.isFinite(keyTimestamp) ? keyTimestamp : 0,
        sessionId: entry.value.sessionId,
        userId: entry.value.userId,
        expiresAt: entry.value.expiresAt,
        nextAttemptAt: entry.value.nextAttemptAt || entry.value.rotationScheduledAt,
        failedAttempts: entry.value.failedAttempts ?? 0,
        lastError: entry.value.lastError,
      })
    }
    out.sort((a, b) => a.nextAttemptAt.localeCompare(b.nextAttemptAt))
    return out.slice(0, Math.max(1, Math.min(limit, 1000)))
  }

  // Helper methods
  private hashToken(token: string): string {
    // Simple hash for demo - in production use crypto
    return btoa(token).substring(0, 32)
  }

  private async getUserProfile(userId: string): Promise<{ email: string; role: string; tenant_id?: string } | null> {
    try {
      // Use auth.users as the source of truth; avoid old profile service coupling.
      const result = await postgresService.query(
        `SELECT
           u.email,
           COALESCE(NULLIF(LOWER(TRIM(COALESCE(u.role::text, ''))), ''), 'patient') AS role,
           (
             SELECT ut.tenant_id
             FROM public.user_tenants ut
             WHERE ut.user_id = u.id
               AND COALESCE(ut.is_active, true) = true
             ORDER BY ut.is_primary DESC NULLS LAST, ut.created_at ASC NULLS LAST
             LIMIT 1
           ) AS tenant_id
         FROM auth.users u
         WHERE u.id = $1::uuid
         LIMIT 1`,
        [userId],
      )
      if (!result.rows.length) return null
      const row = result.rows[0] as { email?: unknown; role?: unknown; tenant_id?: unknown }
      const email = typeof row.email === "string" ? row.email : null
      const role = typeof row.role === "string" ? row.role : "patient"
      const tenantId = typeof row.tenant_id === "string" ? row.tenant_id : undefined
      if (!email) return null
      return { email, role, tenant_id: tenantId }
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
