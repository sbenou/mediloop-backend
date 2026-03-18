/**
 * Subscription Service - Manages organization subscriptions
 *
 * Handles subscription lifecycle, feature overrides, and plan transitions.
 * This is the service that ties organizations to their plans.
 *
 * File: auth-backend/services/subscriptionService.ts
 */

import { Pool } from "postgres";
import type {
  Subscription,
  SubscriptionWithPlan,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  CreateFeatureOverrideDTO,
  SubscriptionStatus,
  SubscriptionFilters,
  SubscriptionFeatureOverride,
  Feature,
  OrganizationLimits,
  RateLimitConfig,
} from "../types/rateLimiting.ts";
import { SubscriptionError } from "../types/rateLimiting.ts";
import { PlanService } from "./planService.ts";

export class SubscriptionService {
  private planService: PlanService;

  constructor(private pool: Pool) {
    this.planService = new PlanService(pool);
  }

  /**
   * Create a new subscription for an organization
   */
  async createSubscription(
    data: CreateSubscriptionDTO,
  ): Promise<SubscriptionWithPlan> {
    // Get the plan
    const plan = await this.planService.getPlanByKey(data.plan_key);
    if (!plan) {
      throw new SubscriptionError(
        `Plan not found: ${data.plan_key}`,
        "INVALID_PLAN",
      );
    }

    // Check if organization already has an active subscription
    const existing = await this.getActiveSubscriptionByOrganization(
      data.organization_id,
    );
    if (existing) {
      throw new SubscriptionError(
        "Organization already has an active subscription",
        "INVALID_PLAN",
      );
    }

    const now = new Date();
    const trialDays = data.trial_days || 0;
    const trialEndsAt =
      trialDays > 0
        ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
        : null;

    // Default subscription period: 1 month
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const result = await this.pool.queryObject<Subscription>(
      `INSERT INTO subscriptions (
        organization_id, plan_id, status, trial_ends_at,
        current_period_start, current_period_end, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        data.organization_id,
        plan.id,
        data.status || (trialEndsAt ? "trial" : "active"),
        trialEndsAt,
        now,
        periodEnd,
        data.metadata || null,
      ],
    );

    const subscription = result.rows[0];
    if (!subscription) {
      throw new SubscriptionError(
        "Failed to create subscription",
        "INVALID_PLAN",
      );
    }

    return this.getSubscriptionWithPlan(subscription.id);
  }

  /**
   * Get subscription by ID with full plan details
   */
  async getSubscriptionWithPlan(id: string): Promise<SubscriptionWithPlan> {
    const subscription = await this.getSubscriptionById(id);
    if (!subscription) {
      throw new SubscriptionError(`Subscription not found: ${id}`, "NOT_FOUND");
    }

    return this.enrichSubscriptionWithPlan(subscription);
  }

  /**
   * Get subscription by ID (without relations)
   */
  async getSubscriptionById(id: string): Promise<Subscription | null> {
    const result = await this.pool.queryObject<Subscription>(
      `SELECT * FROM subscriptions WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Get active subscription for an organization
   */
  async getActiveSubscriptionByOrganization(
    organizationId: string,
  ): Promise<SubscriptionWithPlan | null> {
    const result = await this.pool.queryObject<Subscription>(
      `SELECT * FROM subscriptions
       WHERE organization_id = $1
       AND status IN ('active', 'trial')
       ORDER BY created_at DESC
       LIMIT 1`,
      [organizationId],
    );

    const subscription = result.rows[0];
    if (!subscription) return null;

    return this.enrichSubscriptionWithPlan(subscription);
  }

  /**
   * Get all subscriptions with optional filters
   */
  async getSubscriptions(
    filters?: SubscriptionFilters,
  ): Promise<Subscription[]> {
    let query = `SELECT * FROM subscriptions WHERE 1=1`;
    const params: unknown[] = [];
    let paramCount = 1;

    if (filters?.organization_id) {
      query += ` AND organization_id = $${paramCount++}`;
      params.push(filters.organization_id);
    }

    if (filters?.plan_id) {
      query += ` AND plan_id = $${paramCount++}`;
      params.push(filters.plan_id);
    }

    if (filters?.status) {
      query += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters?.active_only) {
      query += ` AND status IN ('active', 'trial')`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.pool.queryObject<Subscription>(query, params);
    return result.rows;
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    id: string,
    data: UpdateSubscriptionDTO,
  ): Promise<Subscription | null> {
    const client = await this.pool.connect();

    try {
      await client.queryObject("BEGIN");

      const updates: string[] = [];
      const values: unknown[] = [];
      let paramCount = 1;

      // Handle plan change
      if (data.plan_key) {
        const plan = await this.planService.getPlanByKey(data.plan_key);
        if (!plan) {
          throw new SubscriptionError(
            `Plan not found: ${data.plan_key}`,
            "INVALID_PLAN",
          );
        }
        updates.push(`plan_id = $${paramCount++}`);
        values.push(plan.id);
      }

      if (data.status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(data.status);

        // If cancelling, set cancelled_at
        if (data.status === "cancelled") {
          updates.push(`cancelled_at = NOW()`);
        }
      }

      if (data.metadata !== undefined) {
        updates.push(`metadata = $${paramCount++}`);
        values.push(data.metadata);
      }

      if (updates.length === 0) {
        await client.queryObject("COMMIT");
        return this.getSubscriptionById(id);
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const result = await client.queryObject<Subscription>(
        `UPDATE subscriptions
         SET ${updates.join(", ")}
         WHERE id = $${paramCount}
         RETURNING *`,
        values,
      );

      await client.queryObject("COMMIT");
      return result.rows[0] || null;
    } catch (error) {
      await client.queryObject("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create a feature override for a subscription
   */
  async createFeatureOverride(
    data: CreateFeatureOverrideDTO,
  ): Promise<SubscriptionFeatureOverride> {
    // Verify subscription exists
    const subscription = await this.getSubscriptionById(data.subscription_id);
    if (!subscription) {
      throw new SubscriptionError(
        `Subscription not found: ${data.subscription_id}`,
        "NOT_FOUND",
      );
    }

    // Verify feature exists
    const featureResult = await this.pool.queryObject<Feature>(
      `SELECT id FROM features WHERE key = $1`,
      [data.feature_key],
    );

    if (featureResult.rows.length === 0) {
      throw new SubscriptionError(
        `Feature not found: ${data.feature_key}`,
        "NOT_FOUND",
      );
    }

    const featureId = featureResult.rows[0].id;

    const expiresAt = data.expires_in_days
      ? new Date(Date.now() + data.expires_in_days * 24 * 60 * 60 * 1000)
      : null;

    const result = await this.pool.queryObject<SubscriptionFeatureOverride>(
      `INSERT INTO subscription_feature_overrides (
        subscription_id, feature_id, override_value, reason, expires_at
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (subscription_id, feature_id)
      DO UPDATE SET
        override_value = $3,
        reason = $4,
        expires_at = $5,
        created_at = NOW()
      RETURNING *`,
      [
        data.subscription_id,
        featureId,
        data.override_value,
        data.reason || null,
        expiresAt,
      ],
    );

    return result.rows[0];
  }

  /**
   * Remove a feature override
   */
  async removeFeatureOverride(
    subscriptionId: string,
    featureKey: string,
  ): Promise<boolean> {
    const result = await this.pool.queryObject(
      `DELETE FROM subscription_feature_overrides
       WHERE subscription_id = $1
       AND feature_id = (SELECT id FROM features WHERE key = $2)`,
      [subscriptionId, featureKey],
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get complete organization limits (plan features + overrides)
   * This is THE key method that the rate limiting middleware will use
   */
  async getOrganizationLimits(
    organizationId: string,
  ): Promise<OrganizationLimits> {
    const subscription =
      await this.getActiveSubscriptionByOrganization(organizationId);

    if (!subscription) {
      throw new SubscriptionError(
        "Organization has no active subscription",
        "NOT_FOUND",
      );
    }

    // Check if trial expired
    if (
      subscription.status === "trial" &&
      subscription.trial_ends_at &&
      new Date() > subscription.trial_ends_at
    ) {
      // Auto-expire the trial
      await this.updateSubscription(subscription.id, { status: "expired" });
      throw new SubscriptionError("Trial subscription expired", "EXPIRED");
    }

    // Build the limits object
    const limits: OrganizationLimits = {
      organization_id: organizationId,
      subscription_id: subscription.id,
      plan_key: subscription.plan.key,
      plan_name: subscription.plan.name,
      status: subscription.status,
      rate_limits: {},
      storage_limit_gb: 0,
      max_patients: 0,
      max_users: 0,
      api_access_enabled: false,
      trial_ends_at: subscription.trial_ends_at,
    };

    // Process all features (plan + overrides)
    const featureMap = new Map<string, string>();

    // 1. Add plan features
    for (const feature of subscription.plan.features) {
      featureMap.set(feature.key, feature.pivot_value);
    }

    // 2. Apply overrides (they take precedence)
    for (const override of subscription.feature_overrides) {
      // Check if override is still valid
      if (!override.expires_at || new Date() < override.expires_at) {
        featureMap.set(override.feature.key, override.override_value);
      }
    }

    // 3. Parse features into limits
    for (const [key, value] of featureMap.entries()) {
      if (key.startsWith("rate_limit_")) {
        // Parse rate limit feature
        const endpointKey = key.replace("rate_limit_", "");
        try {
          const config = JSON.parse(value) as {
            max_requests: number;
            window_seconds: number;
            enabled?: boolean;
          };

          limits.rate_limits[endpointKey] = {
            endpoint: endpointKey,
            max_requests: config.max_requests,
            window_seconds: config.window_seconds,
            enabled: config.enabled ?? true,
          };
        } catch (error) {
          console.error(`Failed to parse rate limit for ${key}:`, error);
        }
      } else if (key === "storage_limit_gb") {
        limits.storage_limit_gb = parseInt(value, 10) || 0;
      } else if (key === "max_patients") {
        limits.max_patients = parseInt(value, 10) || 0;
      } else if (key === "max_users") {
        limits.max_users = parseInt(value, 10) || 0;
      } else if (key === "api_access_enabled") {
        limits.api_access_enabled = value === "true" || value === "1";
      }
    }

    return limits;
  }

  /**
   * Check subscription status and auto-transition if needed
   */
  async checkAndUpdateSubscriptionStatus(
    subscriptionId: string,
  ): Promise<SubscriptionStatus> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription) {
      throw new SubscriptionError(
        `Subscription not found: ${subscriptionId}`,
        "NOT_FOUND",
      );
    }

    const now = new Date();

    // Check trial expiration
    if (
      subscription.status === "trial" &&
      subscription.trial_ends_at &&
      now > subscription.trial_ends_at
    ) {
      await this.updateSubscription(subscriptionId, { status: "expired" });
      return "expired";
    }

    // Check period expiration
    if (
      subscription.status === "active" &&
      now > subscription.current_period_end
    ) {
      // In a real system, this would check payment status
      // For now, we'll just extend the period
      const newEnd = new Date(subscription.current_period_end);
      newEnd.setMonth(newEnd.getMonth() + 1);

      await this.pool.queryObject(
        `UPDATE subscriptions
         SET current_period_start = current_period_end,
             current_period_end = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [newEnd, subscriptionId],
      );
    }

    return subscription.status;
  }

  /**
   * Helper: Enrich subscription with plan and overrides
   */
  private async enrichSubscriptionWithPlan(
    subscription: Subscription,
  ): Promise<SubscriptionWithPlan> {
    // Get plan with features and services
    const plan = await this.planService.getPlanByIdWithRelations(
      subscription.plan_id,
    );

    // Get active feature overrides
    const overridesResult = await this.pool.queryObject<
      SubscriptionFeatureOverride & { feature: Feature }
    >(
      `SELECT sfo.*, f.* as feature
       FROM subscription_feature_overrides sfo
       JOIN features f ON sfo.feature_id = f.id
       WHERE sfo.subscription_id = $1
       AND (sfo.expires_at IS NULL OR sfo.expires_at > NOW())`,
      [subscription.id],
    );

    return {
      ...subscription,
      plan,
      feature_overrides: overridesResult.rows,
    };
  }
}
