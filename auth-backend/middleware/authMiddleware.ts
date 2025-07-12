
import { Context, Next } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { enhancedJwtService } from "../services/enhancedJwtService.ts"

export const authMiddleware = async (ctx: Context, next: Next) => {
  const authHeader = ctx.request.headers.get("Authorization")
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401
    ctx.response.body = { message: "Authorization header required" }
    return
  }

  const token = authHeader.substring(7) // Remove "Bearer " prefix
  
  try {
    // Get client IP for security logging
    const forwarded = ctx.request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : (ctx.request.ip || 'unknown')

    // Validate JWT token using the enhanced JWT service
    const verification = await enhancedJwtService.verifyToken(token, ipAddress)
    
    if (!verification.valid) {
      ctx.response.status = 401
      ctx.response.body = { message: verification.error || "Invalid or expired token" }
      return
    }

    // Add the verified payload to the context for use in protected routes
    ctx.state.user = {
      id: verification.payload.sub,
      email: verification.payload.email,
      role: verification.payload.role,
      tenant_id: verification.payload.tenant_id,
      session_id: verification.session_id
    }
    ctx.state.token = token
    
    await next()
  } catch (error) {
    console.error('JWT verification error in middleware:', error)
    ctx.response.status = 401
    ctx.response.body = { message: "Token verification failed" }
    return
  }
}
