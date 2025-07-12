
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { enhancedJwtService } from "../services/enhancedJwtService.ts"
import { sessionService } from "../services/sessionService.ts"
import { authMiddleware } from "../middleware/authMiddleware.ts"

const tokenRoutes = new Router()

// Get client IP helper
function getClientIP(ctx: any): string {
  const forwarded = ctx.request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return ctx.request.ip || 'unknown'
}

// Get User Agent helper
function getUserAgent(ctx: any): string {
  return ctx.request.headers.get('user-agent') || 'unknown'
}

// Refresh token endpoint
tokenRoutes.post('/refresh-token', async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { token } = body
    
    if (!token) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Token required' }
      return
    }

    const ipAddress = getClientIP(ctx)
    const userAgent = getUserAgent(ctx)

    const newTokenData = await enhancedJwtService.refreshToken(token, ipAddress, userAgent)
    
    if (!newTokenData) {
      ctx.response.status = 401
      ctx.response.body = { error: 'Invalid or expired token' }
      return
    }

    ctx.response.body = {
      access_token: newTokenData.token,
      token_type: 'Bearer',
      expires_in: 86400,
      session_id: newTokenData.sessionId,
      expires_at: newTokenData.expiresAt.toISOString()
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Token refresh failed' }
  }
})

// Revoke token endpoint
tokenRoutes.post('/revoke-token', authMiddleware, async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { token, reason } = body
    
    if (!token) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Token required' }
      return
    }

    const userId = ctx.state.user.id
    const success = await enhancedJwtService.revokeToken(token, userId, reason || 'USER_REVOKED')
    
    if (success) {
      ctx.response.body = { message: 'Token revoked successfully' }
    } else {
      ctx.response.status = 400
      ctx.response.body = { error: 'Failed to revoke token' }
    }
  } catch (error) {
    console.error('Token revocation error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Token revocation failed' }
  }
})

// Revoke all user tokens
tokenRoutes.post('/revoke-all-tokens', authMiddleware, async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value
    const { reason } = body
    
    const userId = ctx.state.user.id
    const success = await enhancedJwtService.revokeAllUserTokens(userId, reason || 'USER_REVOKED_ALL')
    
    if (success) {
      ctx.response.body = { message: 'All tokens revoked successfully' }
    } else {
      ctx.response.status = 400
      ctx.response.body = { error: 'Failed to revoke tokens' }
    }
  } catch (error) {
    console.error('Bulk token revocation error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Bulk token revocation failed' }
  }
})

// Get user sessions
tokenRoutes.get('/sessions', authMiddleware, async (ctx) => {
  try {
    const userId = ctx.state.user.id
    const sessions = await sessionService.getUserSessions(userId)
    
    // Remove sensitive data
    const safeSessions = sessions.map(session => ({
      id: session.id,
      created_at: session.created_at,
      last_used: session.last_used,
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      is_active: session.is_active
    }))
    
    ctx.response.body = { sessions: safeSessions }
  } catch (error) {
    console.error('Get sessions error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Failed to get sessions' }
  }
})

// Get security audit log
tokenRoutes.get('/security-log', authMiddleware, async (ctx) => {
  try {
    const userId = ctx.state.user.id
    const url = new URL(ctx.request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    
    const auditLog = await sessionService.getSecurityAuditLog(userId, limit)
    
    ctx.response.body = { audit_log: auditLog }
  } catch (error) {
    console.error('Get security log error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Failed to get security log' }
  }
})

// Verify token endpoint (enhanced)
tokenRoutes.post('/verify-token', async (ctx) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 400
      ctx.response.body = { error: 'Authorization header required' }
      return
    }

    const token = authHeader.substring(7)
    const ipAddress = getClientIP(ctx)
    const validation = await enhancedJwtService.verifyToken(token, ipAddress)
    
    if (!validation.valid) {
      ctx.response.status = 401
      ctx.response.body = { error: validation.error || 'Invalid token' }
      return
    }

    ctx.response.body = { 
      valid: true, 
      payload: validation.payload,
      session_id: validation.session_id
    }
  } catch (error) {
    console.error('Token verification error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Verification failed' }
  }
})

// Token cleanup endpoint (admin)
tokenRoutes.post('/cleanup-expired', async (ctx) => {
  try {
    // Simple admin check - could be enhanced with proper admin middleware
    const authHeader = ctx.request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401
      ctx.response.body = { error: 'Authorization required' }
      return
    }

    await enhancedJwtService.cleanupExpiredTokens()
    ctx.response.body = { message: 'Token cleanup completed' }
  } catch (error) {
    console.error('Token cleanup error:', error)
    ctx.response.status = 500
    ctx.response.body = { error: 'Token cleanup failed' }
  }
})

export { tokenRoutes }
