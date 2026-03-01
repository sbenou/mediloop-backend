import { Context, Next } from "oak";
import { enhancedJwtService } from "../services/enhancedJwtService.ts";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/register",
  "/login",
  "/health",
  "/verify-token",
  "/refresh",
  "/auth/register",
  "/auth/login",
  "/auth/verify-token",
  "/auth/refresh",
  "/password-reset/request",
  "/password-reset/verify",
  "/password-reset/reset",
  "/invitations/validate",
  "/invitations/accept",
];

export const authMiddleware = async (ctx: Context, next: Next) => {
  const path = ctx.request.url.pathname;

  // Skip authentication for public routes
  if (PUBLIC_ROUTES.some((route) => path.includes(route))) {
    await next();
    return;
  }

  const authHeader = ctx.request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = { message: "Authorization header required" };
    return;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    // Get client IP for security logging
    const forwarded = ctx.request.headers.get("x-forwarded-for");
    const ipAddress = forwarded
      ? forwarded.split(",")[0].trim()
      : ctx.request.ip || "unknown";

    // Validate JWT token using the enhanced JWT service
    const verification = await enhancedJwtService.verifyToken(token, ipAddress);

    if (!verification.valid) {
      ctx.response.status = 401;
      ctx.response.body = {
        message: verification.error || "Invalid or expired token",
      };
      return;
    }

    // Add the verified payload to the context for use in protected routes
    ctx.state.user = {
      id: verification.payload.sub,
      email: verification.payload.email,
      role: verification.payload.role,
      tenant_id: verification.payload.tenant_id,
      session_id: verification.session_id,
    };
    ctx.state.token = token;

    await next();
  } catch (error) {
    console.error("JWT verification error in middleware:", error);
    ctx.response.status = 401;
    ctx.response.body = { message: "Token verification failed" };
    return;
  }
};
