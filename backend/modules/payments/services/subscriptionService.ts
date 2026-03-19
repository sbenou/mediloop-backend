/**
 * Subscription Service - Manages organization subscriptions
 *
 * Handles subscription lifecycle, feature overrides, and plan transitions.
 * This is the service that ties organizations to their plans.
 *
 * FIXED V3: Uses postgresService + proper pivot_value from actual Feature type
 */

import { postgresService } from "../../../shared/services/postgresService.ts";
import type {
  Subscription,
  SubscriptionWithPlan,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  CreateFeatureOverrideDTO,
  SubscriptionStatus,
  SubscriptionFilters,
  SubscriptionFeatureOverride,
} from "../../../shared/types/index.ts";
import type {
  OrganizationLimits,
  RateLimitConfig,
} from "../../../shared/types/rateLimit.ts";
import { PlanService } from "./planService.ts";

export class SubscriptionError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "EXPIRED" | "SUSPENDED" | "INVALID_PLAN",
  ) {
    super(message);
    this.name = "SubscriptionError";
  }
}

export class SubscriptionService {
  private planService: PlanService;

  constructor() {
    this.planService = new PlanService();
  }

  /**
   * Get organization limits for rate limiting and feature access
   *
   * This method returns a complete OrganizationLimits object that includes:
   * - Rate limit configurations for all endpoints
   * - Storage limits
   * - Capacity limits (patients, users)
   * - API access flags
   */
  async getOrganizationLimits(
    organizationId: string,
  ): Promise<OrganizationLimits> {
    const subscription =
      await this.getActiveSubscriptionByOrganization(organizationId);

    if (!subscription) {
      throw new SubscriptionError(
        `No active subscription found for organization: ${organizationId}`,
        "NOT_FOUND", // ✅ Changed from "NO_SUBSCRIPTION" to "NOT_FOUND"
      );
    }

    // Build rate limits object from plan features
    const rateLimits: { [endpointKey: string]: RateLimitConfig } = {};
    const planFeatures = subscription.plan.features || [];

    // Extract rate limit features
    // NOTE: features array has type: Array<Feature & { pivot_value: string }>
    for (const feature of planFeatures) {
      if (feature.key.startsWith("rate_limit_")) {
        try {
          const config = JSON.parse(feature.pivot_value); // ✅ Use pivot_value, not value
          const endpointKey = feature.key.replace("rate_limit_", "");
          rateLimits[endpointKey] = {
            endpoint: endpointKey,
            max_requests: config.max_requests,
            window_seconds: config.window_seconds,
            enabled: config.enabled,
          };
        } catch (error) {
          console.error(
            `Failed to parse rate limit feature ${feature.key}:`,
            error,
          );
        }
      }
    }

    // Helper to get feature value from pivot_value
    const getFeatureValue = (key: string, defaultValue: any) => {
      const feature = planFeatures.find((f) => f.key === key);
      if (!feature) return defaultValue;

      // Parse based on value_type
      if (feature.value_type === "integer") {
        return parseInt(feature.pivot_value, 10);
      } else if (feature.value_type === "boolean") {
        return feature.pivot_value === "true";
      } else if (feature.value_type === "json") {
        try {
          return JSON.parse(feature.pivot_value);
        } catch {
          return defaultValue;
        }
      }
      return feature.pivot_value;
    };

    return {
      organization_id: organizationId,
      subscription_id: subscription.id,
      plan_key: subscription.plan.key,
      plan_name: subscription.plan.name,
      status: subscription.status,
      rate_limits: rateLimits,
      storage_limit_gb: getFeatureValue("storage_limit_gb", 10),
      max_patients: getFeatureValue("max_patients", 100),
      max_users: getFeatureValue("max_users", 5),
      api_access_enabled: getFeatureValue("api_access_enabled", false),
      trial_ends_at: subscription.trial_ends_at,
    };
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

    const result = await postgresService.query(
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
    const result = await postgresService.query(
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
    const result = await postgresService.query(
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

    const result = await postgresService.query(query, params);
    return result.rows;
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    id: string,
    data: UpdateSubscriptionDTO,
  ): Promise<Subscription | null> {
    const client = await postgresService.getClient();

    if (!client) {
      // ✅ Use regular Error, not SubscriptionError (DB_ERROR is not a valid code)
      throw new Error("Failed to get database client");
    }

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
      postgresService.releaseClient(client);
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
    const featureResult = await postgresService.query(
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

    const result = await postgresService.query(
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
    const result = await postgresService.query(
      `DELETE FROM subscription_feature_overrides
       WHERE subscription_id = $1
       AND feature_id = (SELECT id FROM features WHERE key = $2)`,
      [subscriptionId, featureKey],
    );

    return result.rowCount !== null && result.rowCount > 0;
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
      await this.updateSubscription(subscriptionId, {
        status: "expired" as SubscriptionStatus, // ✅ Cast to type
      });
      return "expired" as SubscriptionStatus; // ✅ Cast to type
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

      await postgresService.query(
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
    const overridesResult = await postgresService.query(
      `SELECT sfo.*, f.*
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
