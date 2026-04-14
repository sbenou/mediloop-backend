/**
 * Subscription Routes
 * Handles pharmacy subscription checkout and management
 */

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { stripeService } from "../services/stripeService.ts";
import { PlanService } from "../services/planService.ts";
import type { PlanWithFeatures } from "../../../shared/types/index.ts";

const router = new Router();
const planService = new PlanService();

type DisplayPlanResponse = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  monthly_price_cents: number | null;
  annual_price_cents: number | null;
  status: string;
  is_public: boolean;
  display_order: number;
  target_role: string | null;
  metadata: Record<string, unknown> | null;
  displayFeatures: string[];
  displayServices: string[];
  technicalFeatures: Array<{
    key: string;
    name: string;
    category: string;
    value_type: string;
    value: string;
  }>;
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function toDisplayPlan(plan: PlanWithFeatures): DisplayPlanResponse {
  const items = plan.marketing_items ?? [];
  const displayFeatures = items
    .filter((item) => item.kind === "feature" && item.visibility !== "comparison_only")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => item.label);
  const displayServices = items
    .filter((item) => item.kind === "service" && item.visibility !== "comparison_only")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => item.label);

  return {
    id: plan.id,
    key: plan.key,
    name: plan.name,
    description: plan.description,
    monthly_price_cents: plan.monthly_price_cents,
    annual_price_cents: plan.annual_price_cents,
    status: String(plan.status),
    is_public: plan.is_public,
    display_order: plan.display_order,
    target_role: (plan.metadata?.target_role as string | undefined) ?? null,
    metadata: plan.metadata,
    displayFeatures,
    displayServices,
    technicalFeatures: plan.features.map((feature) => ({
      key: feature.key,
      name: feature.name,
      category: String(feature.category),
      value_type: feature.value_type,
      value: feature.pivot_value,
    })),
  };
}

/**
 * List subscription plans with display-ready marketing + technical data.
 * GET /api/subscriptions/plans?role=doctor
 */
router.get("/api/subscriptions/plans", async (ctx) => {
  try {
    const role = ctx.request.url.searchParams.get("role")?.trim().toLowerCase();
    const plans = await planService.getPlans({ is_public: true, status: "active" });
    const filtered = role
      ? plans.filter((p) => {
        const targetRole = (p.metadata?.target_role as string | undefined)?.toLowerCase();
        return targetRole === role;
      })
      : plans;

    const displayPlans: DisplayPlanResponse[] = [];
    for (const plan of filtered) {
      const withRelations = await planService.getPlanByIdWithRelations(plan.id);
      displayPlans.push(toDisplayPlan(withRelations));
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      role: role ?? null,
      plans: displayPlans.sort((a, b) => a.display_order - b.display_order),
    };
  } catch (error) {
    console.error("❌ Error listing plans:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: getErrorMessage(error, "Failed to list plans"),
    };
  }
});

// Middleware to verify JWT (you should already have this)
// Import your existing authMiddleware
// import { authMiddleware } from "../middleware/authMiddleware.ts";

/**
 * Create pharmacy subscription checkout session
 * POST /api/subscriptions/pharmacy
 *
 * Creates a Stripe checkout session for pharmacy subscription
 */
router.post("/api/subscriptions/pharmacy", async (ctx) => {
  try {
    // Get authenticated user from middleware
    // const user = ctx.state.user; // From authMiddleware

    // For now, get from request body (add authMiddleware later)
    const { userId, pharmacyId } = await ctx.request.body({ type: "json" })
      .value;

    if (!userId || !pharmacyId) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "userId and pharmacyId are required",
      };
      return;
    }

    // Get user email from database
    const { db } = await import("../db/connection.ts");
    const userResult = await db.query(
      `SELECT email FROM public.users WHERE id = $1`,
      [userId],
    );

    if (!userResult.rows[0]) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    const email = userResult.rows[0].email;
    const origin =
      ctx.request.headers.get("origin") ||
      Deno.env.get("FRONTEND_URL") ||
      "http://localhost:5173";

    // Create Stripe checkout session
    const session = await stripeService.createPharmacyCheckoutSession({
      userId,
      pharmacyId,
      email,
      successUrl: `${origin}/settings?subscription=success&pharmacy_id=${pharmacyId}`,
      cancelUrl: `${origin}/settings?subscription=cancelled`,
    });

    ctx.response.status = 200;
    ctx.response.body = {
      url: session.url,
      sessionId: session.id,
    };

    console.log(
      `✅ Pharmacy checkout session created for pharmacy ${pharmacyId}`,
    );
  } catch (error) {
    console.error("❌ Error creating subscription:", error);

    ctx.response.status = 500;
    ctx.response.body = {
      error: getErrorMessage(error, "Failed to create subscription"),
    };
  }
});

/**
 * Cancel pharmacy subscription
 * POST /api/subscriptions/pharmacy/cancel
 */
router.post("/api/subscriptions/pharmacy/cancel", async (ctx) => {
  try {
    const { subscriptionId } = await ctx.request.body({ type: "json" }).value;

    if (!subscriptionId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "subscriptionId is required" };
      return;
    }

    // Cancel subscription
    const subscription = await stripeService.cancelSubscription(subscriptionId);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        canceledAt: subscription.canceled_at,
      },
    };

    console.log(`✅ Subscription cancelled: ${subscriptionId}`);
  } catch (error) {
    console.error("❌ Error cancelling subscription:", error);

    ctx.response.status = 500;
    ctx.response.body = {
      error: getErrorMessage(error, "Failed to cancel subscription"),
    };
  }
});

/**
 * Get subscription details
 * GET /api/subscriptions/:subscriptionId
 */
router.get("/api/subscriptions/:subscriptionId", async (ctx) => {
  try {
    const { subscriptionId } = ctx.params;

    if (!subscriptionId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "subscriptionId is required" };
      return;
    }

    const subscription = await stripeService.getSubscription(subscriptionId);

    ctx.response.status = 200;
    ctx.response.body = {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching subscription:", error);

    ctx.response.status = 404;
    ctx.response.body = {
      error: "Subscription not found",
    };
  }
});

/**
 * List customer subscriptions
 * GET /api/subscriptions/customer/:customerId
 */
router.get("/api/subscriptions/customer/:customerId", async (ctx) => {
  try {
    const { customerId } = ctx.params;

    if (!customerId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "customerId is required" };
      return;
    }

    const subscriptions =
      await stripeService.listCustomerSubscriptions(customerId);

    ctx.response.status = 200;
    ctx.response.body = {
      subscriptions: subscriptions.map((sub) => ({
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      })),
    };
  } catch (error) {
    console.error("❌ Error listing subscriptions:", error);

    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to list subscriptions",
    };
  }
});

export default router;
