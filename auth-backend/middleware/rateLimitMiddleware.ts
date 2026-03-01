/**
 * Rate Limiting Middleware for Deno Backend
 *
 * Provides IP-based rate limiting using Deno KV store.
 * Matches Supabase's rate limiting behavior.
 *
 * File: auth-backend/middleware/rateLimitMiddleware.ts
 */

import { Context, Middleware } from "oak";
import { kvStore } from "../services/kvStore.ts";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix: string; // Prefix for KV keys (e.g., "ratelimit:login")
  message?: string; // Custom error message
}

interface RateLimitData {
  count: number;
  startTime: number;
  firstAttempt: number;
}

/**
 * Get client IP address from request
 * Handles X-Forwarded-For header for proxied requests
 */
const getClientIP = (ctx: Context): string => {
  const forwarded = ctx.request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return ctx.request.ip || "unknown";
};

/**
 * Create a rate limiter middleware
 *
 * @param config Rate limit configuration
 * @returns Oak middleware function
 *
 * Example:
 * ```typescript
 * const limiter = createRateLimiter({
 *   windowMs: 15 * 60 * 1000,  // 15 minutes
 *   maxRequests: 5,
 *   keyPrefix: 'ratelimit:login',
 *   message: 'Too many login attempts'
 * });
 *
 * authRoutes.post('/api/auth/login', limiter, async (ctx) => {
 *   // ... login logic
 * });
 * ```
 */
export const createRateLimiter = (config: RateLimitConfig): Middleware => {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    const clientIP = getClientIP(ctx);
    const key = `${config.keyPrefix}:${clientIP}`;

    try {
      const existing = (await kvStore.get(key)) as RateLimitData | null;
      const now = Date.now();

      // First request in window
      if (!existing) {
        await kvStore.set(
          key,
          {
            count: 1,
            startTime: now,
            firstAttempt: now,
          },
          Math.ceil(config.windowMs / 1000), // TTL in seconds
        );

        // Set rate limit headers
        ctx.response.headers.set(
          "X-RateLimit-Limit",
          config.maxRequests.toString(),
        );
        ctx.response.headers.set(
          "X-RateLimit-Remaining",
          (config.maxRequests - 1).toString(),
        );
        ctx.response.headers.set(
          "X-RateLimit-Reset",
          new Date(now + config.windowMs).toISOString(),
        );

        await next();
        return;
      }

      const { count, startTime } = existing;
      const elapsed = now - startTime;

      // Window expired, reset counter
      if (elapsed > config.windowMs) {
        await kvStore.set(
          key,
          {
            count: 1,
            startTime: now,
            firstAttempt: now,
          },
          Math.ceil(config.windowMs / 1000),
        );

        ctx.response.headers.set(
          "X-RateLimit-Limit",
          config.maxRequests.toString(),
        );
        ctx.response.headers.set(
          "X-RateLimit-Remaining",
          (config.maxRequests - 1).toString(),
        );
        ctx.response.headers.set(
          "X-RateLimit-Reset",
          new Date(now + config.windowMs).toISOString(),
        );

        await next();
        return;
      }

      // Rate limit exceeded
      if (count >= config.maxRequests) {
        const remainingMs = config.windowMs - elapsed;
        const remainingSec = Math.ceil(remainingMs / 1000);

        console.warn(
          `[Rate Limit] IP ${clientIP} exceeded limit for ${config.keyPrefix}: ${count}/${config.maxRequests} requests`,
        );

        ctx.response.status = 429;
        ctx.response.body = {
          error: config.message || "Too many requests. Please try again later.",
          retryAfter: remainingSec,
          limit: config.maxRequests,
          remaining: 0,
          resetAt: new Date(now + remainingMs).toISOString(),
        };
        ctx.response.headers.set("Retry-After", remainingSec.toString());
        ctx.response.headers.set(
          "X-RateLimit-Limit",
          config.maxRequests.toString(),
        );
        ctx.response.headers.set("X-RateLimit-Remaining", "0");
        ctx.response.headers.set(
          "X-RateLimit-Reset",
          new Date(now + remainingMs).toISOString(),
        );
        return;
      }

      // Increment counter
      await kvStore.set(
        key,
        {
          ...existing,
          count: count + 1,
        },
        Math.ceil(config.windowMs / 1000),
      );

      // Set rate limit headers
      const remaining = config.maxRequests - count - 1;
      ctx.response.headers.set(
        "X-RateLimit-Limit",
        config.maxRequests.toString(),
      );
      ctx.response.headers.set("X-RateLimit-Remaining", remaining.toString());
      ctx.response.headers.set(
        "X-RateLimit-Reset",
        new Date(startTime + config.windowMs).toISOString(),
      );

      await next();
    } catch (error) {
      console.error("[Rate Limit] Error:", error);
      // Fail open - allow request if rate limiting fails
      // This prevents rate limiting from breaking the app
      await next();
    }
  };
};

// ========== PREDEFINED RATE LIMITERS ==========
// These match Supabase's rate limiting strategy

/**
 * Login Rate Limiter
 * 5 attempts per 15 minutes (prevents brute force attacks)
 */
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyPrefix: "ratelimit:login",
  message: "Too many login attempts. Please try again in 15 minutes.",
});

/**
 * Password Reset Rate Limiter
 * 1 request per minute (prevents email spam)
 */
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1,
  keyPrefix: "ratelimit:password_reset",
  message:
    "Password reset already requested. Please wait 60 seconds before trying again.",
});

/**
 * OTP Rate Limiter
 * 3 requests per 15 minutes (prevents OTP spam)
 */
export const otpRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 3,
  keyPrefix: "ratelimit:otp",
  message: "Too many OTP requests. Please try again in 15 minutes.",
});

export const otpVerifyRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // Allow more attempts than OTP request
  keyPrefix: "ratelimit:otp_verify",
  message:
    "Too many OTP verification attempts. Please request a new OTP or try again in 15 minutes.",
});

/**
 * Registration Rate Limiter
 * 3 registrations per hour (prevents spam accounts)
 */
export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  keyPrefix: "ratelimit:register",
  message: "Too many registration attempts. Please try again later.",
});

/**
 * Token Refresh Rate Limiter
 * 10 refreshes per 5 minutes (prevents refresh abuse)
 */
export const tokenRefreshRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10,
  keyPrefix: "ratelimit:refresh",
  message: "Too many token refresh attempts. Please log in again.",
});

/**
 * Generic API Rate Limiter
 * 100 requests per minute (prevents API abuse)
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyPrefix: "ratelimit:api",
  message: "Too many API requests. Please slow down.",
});
