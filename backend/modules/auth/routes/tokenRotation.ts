
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { tokenRotationService } from "../services/tokenRotationService.ts"
import { enhancedJwtService } from "../services/enhancedJwtService.ts"

const tokenRotationRoutes = new Router()

async function requireSuperadmin(ctx: {
  request: { headers: Headers }
  response: { status: number; body: unknown }
}): Promise<{ sub: string; role?: string } | null> {
  const authHeader = ctx.request.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401
    ctx.response.body = { error: "Authorization header required" }
    return null
  }
  const token = authHeader.substring(7)
  const verification = await enhancedJwtService.verifyToken(token)
  if (!verification.valid || !verification.payload) {
    ctx.response.status = 401
    ctx.response.body = { error: "Invalid token" }
    return null
  }
  const payload = verification.payload as { sub: string; role?: string }
  if ((payload.role || "").toLowerCase() !== "superadmin") {
    ctx.response.status = 403
    ctx.response.body = { error: "Forbidden: superadmin required" }
    return null
  }
  return payload
}

// Client endpoint to check for rotated tokens
tokenRotationRoutes.get('/rotated-token', async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401
      ctx.response.body = { error: 'Authorization header required' }
      return
    }

    const token = authHeader.substring(7)
    const verification = await enhancedJwtService.verifyToken(token)
    
    if (!verification.valid || !verification.payload) {
      ctx.response.status = 401
      ctx.response.body = { error: 'Invalid token' }
      return
    }

    const rotatedToken = await tokenRotationService.getRotatedToken(verification.payload.sub)
    
    if (rotatedToken) {
      ctx.response.body = {
        hasRotatedToken: true,
        token: rotatedToken.token,
        expiresAt: rotatedToken.expiresAt,
        rotatedAt: rotatedToken.rotatedAt
      }
    } else {
      ctx.response.body = {
        hasRotatedToken: false
      }
    }
  } catch (error) {
    console.error('Error checking rotated token:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Failed to check rotated token' }
  }
})

// Manual trigger for testing (admin only)
tokenRotationRoutes.post('/trigger-rotation', async (ctx) => {
  try {
    const who = await requireSuperadmin(ctx)
    if (!who) return
    console.log('[Admin] Manual rotation trigger requested')
    await tokenRotationService.processScheduledRotations()
    ctx.response.body = { message: 'Rotation process triggered successfully', by: who.sub }
  } catch (error) {
    console.error('Error triggering rotation:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Failed to trigger rotation' }
  }
})

// Read-only queue health snapshot (superadmin).
tokenRotationRoutes.get('/admin/rotation-queue', async (ctx) => {
  try {
    const who = await requireSuperadmin(ctx)
    if (!who) return

    const url = ctx.request.url
    let limit = Number.parseInt(url.searchParams.get("limit") || "200")
    if (!Number.isFinite(limit) || limit < 1) limit = 200
    if (limit > 1000) limit = 1000

    const items = await tokenRotationService.getRotationQueueSnapshot(limit)
    ctx.response.body = {
      count: items.length,
      limit,
      now: new Date().toISOString(),
      items,
    }
  } catch (error) {
    console.error('Error reading rotation queue:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Failed to read rotation queue' }
  }
})

export { tokenRotationRoutes }
