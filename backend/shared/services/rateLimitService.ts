/**
 * Dynamic Rate Limiting Service
 *
 * This service provides plan-based rate limiting by querying subscription
 * limits from the database and tracking usage.
 *
 * FIXED: Uses postgresService instead of Pool
 */

import { postgresService } from "./postgresService.ts";
import type {
  RateLimitCheckResult,
  RateLimitUsage,
  RateLimitUsageFilters,
} from "../types/index.ts";
import { SubscriptionService } from "../../modules/payments/services/subscriptionService.ts";

export class RateLimitService {
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  /**
   * Check if request is allowed under rate limits
   *
   * This is the main method that middleware will call
   */
  async checkRateLimit(
    organizationId: string,
    endpointKey: string,
    ipAddress?: string,
  ): Promise<RateLimitCheckResult> {
    // 1. Get organization's rate limit configuration
    const limits =
      await this.subscriptionService.getOrganizationLimits(organizationId);

    const rateLimitConfig = limits.rate_limits[endpointKey];

    // If endpoint not configured or disabled, allow
    if (!rateLimitConfig || !rateLimitConfig.enabled) {
      return {
        allowed: true,
        limit: Infinity,
        remaining: Infinity,
        reset_at: new Date(Date.now() + 60000), // 1 minute from now
        window_seconds: 60,
      };
    }

    const { max_requests, window_seconds } = rateLimitConfig;
    const now = new Date();
    const windowStart = new Date(now.getTime() - window_seconds * 1000);

    // 2. Get or create usage record
    const usage = await this.getOrCreateUsage(
      organizationId,
      endpointKey,
      ipAddress,
      windowStart,
      now,
    );

    // 3. Check if limit exceeded
    if (usage.request_count >= max_requests) {
      const resetAt = new Date(
        usage.window_start.getTime() + window_seconds * 1000,
      );
      const retryAfterSeconds = Math.ceil(
        (resetAt.getTime() - now.getTime()) / 1000,
      );

      return {
        allowed: false,
        limit: max_requests,
        remaining: 0,
        reset_at: resetAt,
        window_seconds,
        retry_after_seconds: retryAfterSeconds,
      };
    }

    // 4. Increment usage
    await this.incrementUsage(usage.id);

    // 5. Return success
    const resetAt = new Date(
      usage.window_start.getTime() + window_seconds * 1000,
    );
    const remaining = max_requests - usage.request_count - 1;

    return {
      allowed: true,
      limit: max_requests,
      remaining,
      reset_at: resetAt,
      window_seconds,
    };
  }

  /**
   * Get or create a rate limit usage record for the current window
   */
  private async getOrCreateUsage(
    organizationId: string,
    endpointKey: string,
    ipAddress: string | undefined,
    windowStart: Date,
    windowEnd: Date,
  ): Promise<RateLimitUsage> {
    // Try to find existing usage in current window
    const existing = await postgresService.query(
      `SELECT * FROM rate_limit_usage
       WHERE organization_id = $1
       AND endpoint_key = $2
       AND window_start >= $3
       AND window_start < $4
       ORDER BY window_start DESC
       LIMIT 1`,
      [organizationId, endpointKey, windowStart, windowEnd],
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // Create new usage record
    const result = await postgresService.query(
      `INSERT INTO rate_limit_usage (
        organization_id, feature_key, endpoint_key, ip_address,
        request_count, window_start, window_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        organizationId,
        `rate_limit_${endpointKey}`, // Feature key
        endpointKey,
        ipAddress || null,
        0,
        windowStart,
        windowEnd,
      ],
    );

    return result.rows[0];
  }

  /**
   * Increment usage count atomically
   */
  private async incrementUsage(usageId: string): Promise<void> {
    await postgresService.query(
      `UPDATE rate_limit_usage
       SET request_count = request_count + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [usageId],
    );
  }

  /**
   * Get usage statistics for an organization
   */
  async getUsageStats(
    filters: RateLimitUsageFilters,
  ): Promise<RateLimitUsage[]> {
    let query = `SELECT * FROM rate_limit_usage WHERE 1=1`;
    const params: unknown[] = [];
    let paramCount = 1;

    if (filters.organization_id) {
      query += ` AND organization_id = $${paramCount++}`;
      params.push(filters.organization_id);
    }

    if (filters.feature_key) {
      query += ` AND feature_key = $${paramCount++}`;
      params.push(filters.feature_key);
    }

    if (filters.endpoint_key) {
      query += ` AND endpoint_key = $${paramCount++}`;
      params.push(filters.endpoint_key);
    }

    if (filters.start_date) {
      query += ` AND window_start >= $${paramCount++}`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ` AND window_end <= $${paramCount++}`;
      params.push(filters.end_date);
    }

    query += ` ORDER BY window_start DESC LIMIT 100`;

    const result = await postgresService.query(query, params);
    return result.rows;
  }

  /**
   * Get usage summary for an organization
   */
  async getUsageSummary(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      endpoint_key: string;
      total_requests: number;
      unique_windows: number;
      avg_requests_per_window: number;
    }>
  > {
    const result = await postgresService.query(
      `SELECT
        endpoint_key,
        SUM(request_count) as total_requests,
        COUNT(*) as unique_windows,
        AVG(request_count) as avg_requests_per_window
       FROM rate_limit_usage
       WHERE organization_id = $1
       AND window_start >= $2
       AND window_end <= $3
       GROUP BY endpoint_key
       ORDER BY total_requests DESC`,
      [organizationId, startDate, endDate],
    );

    return result.rows.map((row) => ({
      ...row,
      total_requests: Number(row.total_requests),
      unique_windows: Number(row.unique_windows),
      avg_requests_per_window: Number(row.avg_requests_per_window),
    }));
  }

  /**
   * Clean up old usage records (run periodically)
   */
  async cleanupOldUsage(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await postgresService.query(
      `DELETE FROM rate_limit_usage
       WHERE window_end < $1`,
      [cutoffDate],
    );

    return result.rowCount || 0;
  }

  /**
   * Reset rate limit for a specific organization and endpoint
   * (Useful for support/admin operations)
   */
  async resetRateLimit(
    organizationId: string,
    endpointKey: string,
  ): Promise<void> {
    await postgresService.query(
      `DELETE FROM rate_limit_usage
       WHERE organization_id = $1
       AND endpoint_key = $2
       AND window_start >= NOW() - INTERVAL '1 hour'`,
      [organizationId, endpointKey],
    );
  }
}
