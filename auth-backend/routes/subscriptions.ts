/**
 * Subscription Routes
 * Handles pharmacy subscription checkout and management
 */

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { stripeService } from "../services/stripeService.ts";

const router = new Router();

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
      error: error.message || "Failed to create subscription",
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
      error: error.message || "Failed to cancel subscription",
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
