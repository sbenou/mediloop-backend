import { Context, Next } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { sessionService } from "../services/sessionService.ts";

export const tokenBlacklistMiddleware = async (ctx: Context, next: Next) => {
  // Skip blacklist check for certain routes that don't require authentication
  const skipRoutes = ['/health', '/auth/login', '/auth/register', '/auth/password-reset'];
  
  if (skipRoutes.some(route => ctx.request.url.pathname.includes(route))) {
    await next();
    return;
  }

  const authHeader = ctx.request.headers.get("Authorization");
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    
    try {
      // Check if token is blacklisted
      const isBlacklisted = await sessionService.isTokenBlacklisted(token);
      
      if (isBlacklisted) {
        ctx.response.status = 401;
        ctx.response.body = { 
          error: "Token has been revoked",
          code: "TOKEN_BLACKLISTED"
        };
        return;
      }
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      // Continue processing - don't block on blacklist check errors
    }
  }
  
  await next();
};