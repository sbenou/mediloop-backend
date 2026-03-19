/**
 * Dynamic Rate Limiting Middleware
 *
 * This middleware integrates with the subscription system to provide
 * plan-based rate limiting without hardcoded limits.
 *
 * File: auth-backend/middleware/dynamicRateLimitMiddleware.ts
 */

import { Context, Middleware } from "oak";
import { Pool } from "postgres";
import { RateLimitService } from "../services/rateLimitService.ts";
import { RateLimitError, SubscriptionError } from "../types/errors.ts";

interface DynamicRateLimitConfig {
  endpointKey: string; // e.g., "login", "api", "password_reset"
  extractOrganizationId: (ctx: Context) => string | Promise<string | null>;
  fallbackBehavior?: "allow" | "deny"; // What to do if org not found
}

/**
 * Get client IP address from request
 */
const getClientIP = (ctx: Context): string => {
  const forwarded = ctx.request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return ctx.request.ip || "unknown";
};

/**
 * Create a dynamic rate limiter middleware
 *
 * This middleware checks the organization's subscription plan and applies
 * the appropriate rate limits from the database.
 *
 * @param pool Database connection pool
 * @param config Rate limit configuration
 * @returns Oak middleware function
 *
 * Example:
 * ```typescript
 * const loginLimiter = createDynamicRateLimiter(pool, {
 *   endpointKey: 'login',
 *   extractOrganizationId: async (ctx) => {
 *     // Extract org from email domain or context
 *     const body = await ctx.request.body().value;
 *     const email = body?.email;
 *     if (!email) return null;
 *
 *     // Query database to find organization
 *     return await getOrgIdFromEmail(email);
 *   },
 *   fallbackBehavior: 'allow' // Allow if no org found
 * });
 *
 * authRoutes.post('/api/auth/login', loginLimiter, async (ctx) => {
 *   // ... login logic
 * });
 * ```
 */
export const createDynamicRateLimiter = (
  pool: Pool,
  config: DynamicRateLimitConfig,
): Middleware => {
  const rateLimitService = new RateLimitService(pool);

  return async (ctx: Context, next: () => Promise<unknown>) => {
    try {
      // 1. Extract organization ID
      const organizationId = await config.extractOrganizationId(ctx);

      if (!organizationId) {
        // No organization found - use fallback behavior
        if (config.fallbackBehavior === "deny") {
          ctx.response.status = 403;
          ctx.response.body = {
            error: "Organization not found",
          };
          return;
        }
        // Default: allow the request
        await next();
        return;
      }

      // 2. Check rate limit
      const clientIP = getClientIP(ctx);
      const result = await rateLimitService.checkRateLimit(
        organizationId,
        config.endpointKey,
        clientIP,
      );

      // 3. Set rate limit headers
      ctx.response.headers.set("X-RateLimit-Limit", result.limit.toString());
      ctx.response.headers.set(
        "X-RateLimit-Remaining",
        result.remaining.toString(),
      );
      ctx.response.headers.set(
        "X-RateLimit-Reset",
        result.reset_at.toISOString(),
      );

      // 4. Check if allowed
      if (!result.allowed) {
        console.warn(
          `[Dynamic Rate Limit] Organization ${organizationId} exceeded limit for ${config.endpointKey}: ` +
            `${result.limit} requests per ${result.window_seconds}s`,
        );

        ctx.response.status = 429;
        ctx.response.body = {
          error: "Rate limit exceeded for your organization's plan",
          retryAfter: result.retry_after_seconds,
          limit: result.limit,
          remaining: 0,
          resetAt: result.reset_at.toISOString(),
          endpoint: config.endpointKey,
        };
        ctx.response.headers.set(
          "Retry-After",
          result.retry_after_seconds!.toString(),
        );
        return;
      }

      // 5. Proceed with request
      await next();
    } catch (error) {
      // Handle specific errors
      if (error instanceof SubscriptionError) {
        console.error(
          `[Dynamic Rate Limit] Subscription error:`,
          error.message,
        );

        // Subscription issues (expired, not found, etc.)
        if (error.code === "NOT_FOUND") {
          ctx.response.status = 403;
          ctx.response.body = {
            error: "No active subscription found for this organization",
            code: error.code,
          };
          return;
        }

        if (error.code === "EXPIRED") {
          ctx.response.status = 402; // Payment Required
          ctx.response.body = {
            error: "Subscription expired. Please renew your plan.",
            code: error.code,
          };
          return;
        }

        if (error.code === "SUSPENDED") {
          ctx.response.status = 403;
          ctx.response.body = {
            error: "Subscription suspended. Please contact support.",
            code: error.code,
          };
          return;
        }
      }

      console.error("[Dynamic Rate Limit] Unexpected error:", error);

      // Fail open - allow request if rate limiting fails
      // This prevents rate limiting from breaking the app
      await next();
    }
  };
};

/**
 * Helper: Extract organization ID from authenticated user context
 *
 * This assumes you have user information in ctx.state.user
 */
export const extractOrgFromAuthUser = (ctx: Context): string | null => {
  const user = ctx.state.user;
  if (!user || !user.organization_id) {
    return null;
  }
  return user.organization_id;
};

/**
 * Helper: Extract organization ID from request body email
 *
 * Useful for login/registration endpoints where user isn't authenticated yet
 */
export const extractOrgFromEmail = async (
  ctx: Context,
  pool: Pool,
): Promise<string | null> => {
  try {
    const body = await ctx.request.body().value;
    const email = body?.email;

    if (!email || typeof email !== "string") {
      return null;
    }

    // Query database to find user's organization
    const result = await pool.queryObject<{ organization_id: string }>(
      `SELECT organization_id
       FROM public.users
       WHERE email = $1
       LIMIT 1`,
      [email],
    );

    return result.rows[0]?.organization_id || null;
  } catch (error) {
    console.error("Error extracting org from email:", error);
    return null;
  }
};

/**
 * Helper: Extract organization ID from custom header
 *
 * Useful for API endpoints where org ID is passed in headers
 */
export const extractOrgFromHeader = (
  ctx: Context,
  headerName: string = "X-Organization-Id",
): string | null => {
  const orgId = ctx.request.headers.get(headerName);
  return orgId || null;
};

// ========== PREDEFINED DYNAMIC RATE LIMITERS ==========

/**
 * Create a login rate limiter that checks the user's organization plan
 */
export const createLoginRateLimiter = (pool: Pool): Middleware => {
  return createDynamicRateLimiter(pool, {
    endpointKey: "login",
    extractOrganizationId: (ctx) => extractOrgFromEmail(ctx, pool),
    fallbackBehavior: "allow", // Allow if org not found (first-time users)
  });
};

/**
 * Create a password reset rate limiter
 */
export const createPasswordResetRateLimiter = (pool: Pool): Middleware => {
  return createDynamicRateLimiter(pool, {
    endpointKey: "password_reset",
    extractOrganizationId: (ctx) => extractOrgFromEmail(ctx, pool),
    fallbackBehavior: "allow",
  });
};

/**
 * Create an API rate limiter for authenticated endpoints
 */
export const createApiRateLimiter = (pool: Pool): Middleware => {
  return createDynamicRateLimiter(pool, {
    endpointKey: "api",
    extractOrganizationId: extractOrgFromAuthUser,
    fallbackBehavior: "deny", // Require organization for API access
  });
};

/**
 * Create a registration rate limiter
 */
export const createRegistrationRateLimiter = (pool: Pool): Middleware => {
  return createDynamicRateLimiter(pool, {
    endpointKey: "registration",
    extractOrganizationId: (ctx) => extractOrgFromHeader(ctx),
    fallbackBehavior: "allow",
  });
};

/**
 * Create an OTP request rate limiter
 */
export const createOtpRateLimiter = (pool: Pool): Middleware => {
  return createDynamicRateLimiter(pool, {
    endpointKey: "otp_request",
    extractOrganizationId: (ctx) => extractOrgFromEmail(ctx, pool),
    fallbackBehavior: "allow",
  });
};

/**
 * Create an OTP verification rate limiter
 */
export const createOtpVerifyRateLimiter = (pool: Pool): Middleware => {
  return createDynamicRateLimiter(pool, {
    endpointKey: "otp_verify",
    extractOrganizationId: (ctx) => extractOrgFromEmail(ctx, pool),
    fallbackBehavior: "allow",
  });
};
