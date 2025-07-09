
import { Context, Next } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { jwtService } from "../services/jwtService.ts"

export const authMiddleware = async (ctx: Context, next: Next) => {
  const authHeader = ctx.request.headers.get("Authorization")
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401
    ctx.response.body = { message: "Authorization header required" }
    return
  }

  const token = authHeader.substring(7) // Remove "Bearer " prefix
  
  try {
    // Validate JWT token using the existing JWT service
    const verification = await jwtService.verifyToken(token)
    
    if (!verification.valid) {
      ctx.response.status = 401
      ctx.response.body = { message: "Invalid or expired token" }
      return
    }

    // Add the verified payload to the context for use in protected routes
    ctx.state.user = {
      id: verification.payload.sub,
      email: verification.payload.email,
      role: verification.payload.role,
      tenant_id: verification.payload.tenant_id
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
