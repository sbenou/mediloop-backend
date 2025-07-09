
import { Context, Next } from "https://deno.land/x/oak@v12.6.1/mod.ts"

export const authMiddleware = async (ctx: Context, next: Next) => {
  const authHeader = ctx.request.headers.get("Authorization")
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401
    ctx.response.body = { message: "Authorization header required" }
    return
  }

  const token = authHeader.substring(7) // Remove "Bearer " prefix
  
  // For now, we'll implement basic token validation
  // This can be enhanced later with proper JWT validation
  if (!token || token.length < 10) {
    ctx.response.status = 401
    ctx.response.body = { message: "Invalid token" }
    return
  }

  // Add the token to the context for use in protected routes
  ctx.state.token = token
  
  await next()
}
