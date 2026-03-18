/**
 * Webhook Routes
 * Handles incoming webhooks from external services (Stripe, etc.)
 */

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { stripeService } from "../services/stripeService.ts";
import { addStripeWebhookJob } from "../queues/stripeQueue.ts";
import { JobPriority } from "../queues/config.ts";

const router = new Router();

/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 *
 * Receives webhooks from Stripe and adds them to BullMQ queue for processing
 * Returns 200 immediately to Stripe (processing happens async in worker)
 */
router.post("/api/webhooks/stripe", async (ctx) => {
  const signature = ctx.request.headers.get("stripe-signature");

  if (!signature) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Missing stripe-signature header" };
    return;
  }

  try {
    // Get raw request body
    const body = await ctx.request.body({ type: "text" }).value;

    // Verify webhook signature and construct event
    const event = await stripeService.constructWebhookEvent({
      body,
      signature,
    });

    console.log(`📨 Stripe webhook received: ${event.type} (${event.id})`);

    // Add to BullMQ queue for reliable processing
    await addStripeWebhookJob(
      {
        eventId: event.id,
        eventType: event.type,
        data: event.data.object as Record<string, any>,
        timestamp: new Date().toISOString(),
      },
      JobPriority.CRITICAL,
    );

    // Return 200 immediately to Stripe (job will be processed by worker)
    ctx.response.status = 200;
    ctx.response.body = { received: true };

    console.log(
      `✅ Webhook queued for processing: ${event.type} (${event.id})`,
    );
  } catch (error) {
    console.error("❌ Webhook processing error:", error);

    // Return appropriate error
    if (error.message.includes("verification failed")) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Webhook verification failed" };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { error: "Internal server error" };
    }
  }
});

/**
 * Health check for webhook endpoint
 * GET /api/webhooks/health
 */
router.get("/api/webhooks/health", (ctx) => {
  ctx.response.status = 200;
  ctx.response.body = {
    status: "healthy",
    timestamp: new Date().toISOString(),
  };
});

export default router;
