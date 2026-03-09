/**
 * Subscription & Rate Limiting Integration Tests
 * 
 * End-to-end tests that verify the complete flow:
 * 1. Create features and services
 * 2. Create a plan with those features/services
 * 3. Create subscription for an organization
 * 4. Check rate limits based on subscription
 * 5. Test overrides
 * 
 * File: auth-backend/tests/integration/subscriptionRateLimiting.test.ts
 * 
 * Run: deno test --allow-env --allow-net auth-backend/tests/integration/subscriptionRateLimiting.test.ts
 */

import { assertEquals, assertExists, assert } from "@std/assert";
import { Pool } from "postgres";
import { FeatureService } from "../../services/featureService.ts";
import { ProfessionalService } from "../../services/professionalService.ts";
import { PlanService } from "../../services/planService.ts";
import { SubscriptionService } from "../../services/subscriptionService.ts";
import { RateLimitService } from "../../services/rateLimitService.ts";
import {
  FeatureCategory,
  ServiceCategory,
  PlanStatus,
  SubscriptionStatus,
} from "../../types/rateLimiting.ts";

// Test database connection
const getTestPool = (): Pool => {
  const databaseUrl = Deno.env.get("TEST_DATABASE_URL") ||
    Deno.env.get("DATABASE_URL");

  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set");
  }

  return new Pool(databaseUrl, 3, true);
};

// Test organization ID (would come from your auth system)
const TEST_ORG_ID = "00000000-0000-0000-0000-000000000001";

Deno.test("Integration - Complete Subscription Flow", async (t) => {
  const pool = getTestPool();

  const featureService = new FeatureService(pool);
  const professionalService = new ProfessionalService(pool);
  const planService = new PlanService(pool);
  const subscriptionService = new SubscriptionService(pool);
  const rateLimitService = new RateLimitService(pool);

  let loginFeatureId: string;
  let apiFeatureId: string;
  let storageFe atureId: string;
  let onboardingServiceId: string;
  let supportServiceId: string;
  let starterPlanId: string;
  let proPlanId: string;
  let subscriptionId: string;

  await t.step("1. Create rate limiting features", async () => {
    // Login rate limit
    const loginFeature = await featureService.createFeature({
      name: "Login Rate Limit",
      key: "rate_limit_login",
      category: FeatureCategory.RATE_LIMITING,
      description: "Maximum login attempts per time window",
      default_value: JSON.stringify({
        max_requests: 5,
        window_seconds: 900, // 15 minutes
        enabled: true,
      }),
      value_type: "json",
    });
    loginFeatureId = loginFeature.id;
    assertExists(loginFeatureId);

    // API rate limit
    const apiFeature = await featureService.createFeature({
      name: "API Rate Limit",
      key: "rate_limit_api",
      category: FeatureCategory.RATE_LIMITING,
      description: "Maximum API requests per minute",
      default_value: JSON.stringify({
        max_requests: 60,
        window_seconds: 60,
        enabled: true,
      }),
      value_type: "json",
    });
    apiFeatureId = apiFeature.id;
    assertExists(apiFeatureId);

    // Storage limit
    const storageFeature = await featureService.createFeature({
      name: "Storage Limit",
      key: "storage_limit_gb",
      category: FeatureCategory.STORAGE,
      description: "Maximum storage in GB",
      default_value: "10",
      value_type: "integer",
    });
    storageFeatureId = storageFeature.id;
    assertExists(storageFeatureId);
  });

  await t.step("2. Create professional services", async () => {
    // Onboarding service
    const onboarding = await professionalService.createService({
      name: "Onboarding Session",
      key: "onboarding_session",
      category: ServiceCategory.ONBOARDING,
      description: "1-hour onboarding session",
      is_recurring: false,
    });
    onboardingServiceId = onboarding.id;
    assertExists(onboardingServiceId);

    // Support service
    const support = await professionalService.createService({
      name: "Priority Support",
      key: "priority_support",
      category: ServiceCategory.SUPPORT,
      description: "Priority email and chat support",
      is_recurring: true,
    });
    supportServiceId = support.id;
    assertExists(supportServiceId);
  });

  await t.step("3. Create Starter plan", async () => {
    const plan = await planService.createPlan({
      name: "Starter Plan",
      key: "starter",
      description: "Perfect for small practices",
      status: PlanStatus.ACTIVE,
      is_public: true,
      monthly_price_cents: 2900, // $29.00
      annual_price_cents: 29000, // $290.00
      display_order: 1,
      features: [
        {
          feature_key: "rate_limit_login",
          value: JSON.stringify({
            max_requests: 5,
            window_seconds: 900,
            enabled: true,
          }),
        },
        {
          feature_key: "rate_limit_api",
          value: JSON.stringify({
            max_requests: 60,
            window_seconds: 60,
            enabled: true,
          }),
        },
        {
          feature_key: "storage_limit_gb",
          value: "10",
        },
      ],
      services: [
        {
          service_key: "onboarding_session",
          quantity: 1,
        },
      ],
    });

    starterPlanId = plan.id;
    assertExists(starterPlanId);
    assertEquals(plan.name, "Starter Plan");
    assertEquals(plan.features.length, 3);
    assertEquals(plan.services.length, 1);
  });

  await t.step("4. Create Pro plan with higher limits", async () => {
    const plan = await planService.createPlan({
      name: "Pro Plan",
      key: "pro",
      description: "For growing practices",
      status: PlanStatus.ACTIVE,
      is_public: true,
      monthly_price_cents: 9900, // $99.00
      annual_price_cents: 99000, // $990.00
      display_order: 2,
      features: [
        {
          feature_key: "rate_limit_login",
          value: JSON.stringify({
            max_requests: 20,
            window_seconds: 900,
            enabled: true,
          }),
        },
        {
          feature_key: "rate_limit_api",
          value: JSON.stringify({
            max_requests: 300,
            window_seconds: 60,
            enabled: true,
          }),
        },
        {
          feature_key: "storage_limit_gb",
          value: "100",
        },
      ],
      services: [
        {
          service_key: "onboarding_session",
          quantity: 2,
        },
        {
          service_key: "priority_support",
          quantity: 1,
        },
      ],
    });

    proPlanId = plan.id;
    assertExists(proPlanId);
    assertEquals(plan.features.length, 3);
    assertEquals(plan.services.length, 2);
  });

  await t.step("5. Create subscription for organization", async () => {
    const subscription = await subscriptionService.createSubscription({
      organization_id: TEST_ORG_ID,
      plan_key: "starter",
      status: SubscriptionStatus.ACTIVE,
    });

    subscriptionId = subscription.id;
    assertExists(subscriptionId);
    assertEquals(subscription.organization_id, TEST_ORG_ID);
    assertEquals(subscription.plan.key, "starter");
    assertEquals(subscription.status, SubscriptionStatus.ACTIVE);
  });

  await t.step("6. Get organization limits", async () => {
    const limits = await subscriptionService.getOrganizationLimits(TEST_ORG_ID);

    assertExists(limits);
    assertEquals(limits.organization_id, TEST_ORG_ID);
    assertEquals(limits.plan_key, "starter");

    // Check rate limits
    assertExists(limits.rate_limits.login);
    assertEquals(limits.rate_limits.login.max_requests, 5);
    assertEquals(limits.rate_limits.login.window_seconds, 900);

    assertExists(limits.rate_limits.api);
    assertEquals(limits.rate_limits.api.max_requests, 60);

    // Check other limits
    assertEquals(limits.storage_limit_gb, 10);
  });

  await t.step("7. Test rate limiting - first request allowed", async () => {
    const result = await rateLimitService.checkRateLimit(
      TEST_ORG_ID,
      "login",
      "192.168.1.1",
    );

    assertEquals(result.allowed, true);
    assertEquals(result.limit, 5);
    assertEquals(result.remaining, 4); // One request used
    assertExists(result.reset_at);
  });

  await t.step("8. Test rate limiting - multiple requests", async () => {
    // Make 4 more requests (total 5 = limit)
    for (let i = 0; i < 4; i++) {
      const result = await rateLimitService.checkRateLimit(
        TEST_ORG_ID,
        "login",
        "192.168.1.1",
      );
      assertEquals(result.allowed, true);
    }

    // 6th request should be blocked
    const blockedResult = await rateLimitService.checkRateLimit(
      TEST_ORG_ID,
      "login",
      "192.168.1.1",
    );

    assertEquals(blockedResult.allowed, false);
    assertEquals(blockedResult.limit, 5);
    assertEquals(blockedResult.remaining, 0);
    assertExists(blockedResult.retry_after_seconds);
    assert(blockedResult.retry_after_seconds! > 0);
  });

  await t.step("9. Create feature override - increase login limit", async () => {
    const override = await subscriptionService.createFeatureOverride({
      subscription_id: subscriptionId,
      feature_key: "rate_limit_login",
      override_value: JSON.stringify({
        max_requests: 100,
        window_seconds: 900,
        enabled: true,
      }),
      reason: "Customer requested higher limit for testing",
      expires_in_days: 7,
    });

    assertExists(override.id);
    assertEquals(override.subscription_id, subscriptionId);
  });

  await t.step("10. Verify override is applied", async () => {
    const limits = await subscriptionService.getOrganizationLimits(TEST_ORG_ID);

    // Should now have override limit
    assertEquals(limits.rate_limits.login.max_requests, 100);
    assertEquals(limits.rate_limits.login.window_seconds, 900);
  });

  await t.step("11. Upgrade subscription to Pro plan", async () => {
    const updated = await subscriptionService.updateSubscription(
      subscriptionId,
      {
        plan_key: "pro",
      },
    );

    assertExists(updated);
    assertEquals(updated!.plan_id, proPlanId);
  });

  await t.step("12. Verify Pro plan limits", async () => {
    const limits = await subscriptionService.getOrganizationLimits(TEST_ORG_ID);

    assertEquals(limits.plan_key, "pro");

    // Login limit should still be override (100)
    assertEquals(limits.rate_limits.login.max_requests, 100);

    // API limit should be Pro plan limit (300)
    assertEquals(limits.rate_limits.api.max_requests, 300);

    // Storage should be Pro limit
    assertEquals(limits.storage_limit_gb, 100);
  });

  await t.step("13. Get usage statistics", async () => {
    const stats = await rateLimitService.getUsageStats({
      organization_id: TEST_ORG_ID,
      endpoint_key: "login",
    });

    assertExists(stats);
    assertEquals(Array.isArray(stats), true);
    assertEquals(stats.length > 0, true);
  });

  await t.step("14. Get usage summary", async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const summary = await rateLimitService.getUsageSummary(
      TEST_ORG_ID,
      yesterday,
      tomorrow,
    );

    assertExists(summary);
    assertEquals(Array.isArray(summary), true);

    const loginSummary = summary.find((s) => s.endpoint_key === "login");
    assertExists(loginSummary);
    assert(loginSummary!.total_requests > 0);
  });

  // Cleanup
  await t.step("15. Cleanup - delete test data", async () => {
    // Delete subscription
    await pool.queryObject(
      `DELETE FROM subscriptions WHERE id = $1`,
      [subscriptionId],
    );

    // Delete plans (cascades to plan_features and plan_services)
    await planService.deletePlan(starterPlanId);
    await planService.deletePlan(proPlanId);

    // Delete features
    await featureService.deleteFeature(loginFeatureId);
    await featureService.deleteFeature(apiFeatureId);
    await featureService.deleteFeature(storageFeatureId);

    // Delete services
    await professionalService.deleteService(onboardingServiceId);
    await professionalService.deleteService(supportServiceId);

    // Clean up usage records
    await rateLimitService.cleanupOldUsage(0); // Delete all
  });

  await pool.end();
});

Deno.test("Integration - Trial Subscription Flow", async (t) => {
  const pool = getTestPool();
  const planService = new PlanService(pool);
  const subscriptionService = new SubscriptionService(pool);
  const featureService = new FeatureService(pool);

  const TEST_ORG_TRIAL = "00000000-0000-0000-0000-000000000002";
  let trialFeatureId: string;
  let trialPlanId: string;
  let trialSubId: string;

  await t.step("1. Setup - create trial feature and plan", async () => {
    const feature = await featureService.createFeature({
      name: "Trial API Limit",
      key: "trial_rate_limit_api",
      category: FeatureCategory.RATE_LIMITING,
      default_value: JSON.stringify({
        max_requests: 10,
        window_seconds: 60,
        enabled: true,
      }),
      value_type: "json",
    });
    trialFeatureId = feature.id;

    const plan = await planService.createPlan({
      name: "Trial Plan",
      key: "trial",
      status: PlanStatus.ACTIVE,
      is_public: false,
      features: [
        {
          feature_key: "trial_rate_limit_api",
          value: JSON.stringify({
            max_requests: 10,
            window_seconds: 60,
            enabled: true,
          }),
        },
      ],
    });
    trialPlanId = plan.id;
  });

  await t.step("2. Create trial subscription", async () => {
    const subscription = await subscriptionService.createSubscription({
      organization_id: TEST_ORG_TRIAL,
      plan_key: "trial",
      trial_days: 14,
    });

    trialSubId = subscription.id;
    assertEquals(subscription.status, SubscriptionStatus.TRIAL);
    assertExists(subscription.trial_ends_at);
  });

  await t.step("3. Verify trial limits work", async () => {
    const limits = await subscriptionService.getOrganizationLimits(
      TEST_ORG_TRIAL,
    );

    assertEquals(limits.status, SubscriptionStatus.TRIAL);
    assertExists(limits.trial_ends_at);
    assertEquals(limits.rate_limits.api.max_requests, 10);
  });

  await t.step("4. Upgrade from trial to paid", async () => {
    const updated = await subscriptionService.updateSubscription(trialSubId, {
      status: SubscriptionStatus.ACTIVE,
    });

    assertEquals(updated!.status, SubscriptionStatus.ACTIVE);
  });

  // Cleanup
  await t.step("5. Cleanup trial test data", async () => {
    await pool.queryObject(
      `DELETE FROM subscriptions WHERE id = $1`,
      [trialSubId],
    );
    await planService.deletePlan(trialPlanId);
    await featureService.deleteFeature(trialFeatureId);
  });

  await pool.end();
});
