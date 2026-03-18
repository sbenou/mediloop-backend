/**
 * Stripe Webhook Worker (Node.js)
 * Processes Stripe webhook events from BullMQ queue
 *
 * This runs as a separate Node.js process with BullMQ
 */

import { Worker } from "bullmq";
import Stripe from "stripe";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Initialize PostgreSQL connection
const DATABASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL_PROD
    : process.env.DATABASE_URL_DEV;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Redis connection config for BullMQ
const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

/**
 * Process checkout.session.completed event
 */
async function handleCheckoutCompleted(session) {
  console.log(`Processing checkout.session.completed: ${session.id}`);

  const pharmacyId = session.metadata?.pharmacy_id;

  if (pharmacyId) {
    // Pharmacy subscription completed
    const result = await pool.query(
      `UPDATE pharmacies SET endorsed = true WHERE id = $1 RETURNING id`,
      [pharmacyId],
    );

    if (result.rows.length === 0) {
      throw new Error(`Pharmacy ${pharmacyId} not found`);
    }

    console.log(`✅ Pharmacy ${pharmacyId} marked as endorsed`);
  } else {
    // Product order completed
    const customerEmail = session.customer_details?.email;

    if (customerEmail) {
      const userResult = await pool.query(
        `SELECT id FROM public.users WHERE email = $1`,
        [customerEmail],
      );

      if (userResult.rows[0]) {
        const userId = userResult.rows[0].id;

        // Record order (adjust table/columns for your schema)
        await pool.query(
          `INSERT INTO orders (user_id, stripe_session_id, amount, status, created_at)
           VALUES ($1, $2, $3, 'completed', NOW())`,
          [userId, session.id, session.amount_total],
        );

        console.log(`✅ Order recorded for user ${userId}`);
      }
    }
  }
}

/**
 * Process customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription) {
  console.log(`Processing subscription.deleted: ${subscription.id}`);

  try {
    // Get customer email
    const customer = await stripe.customers.retrieve(subscription.customer);

    if ("email" in customer && customer.email) {
      // Find pharmacy by user email
      const result = await pool.query(
        `UPDATE pharmacies 
         SET endorsed = false 
         WHERE id IN (
           SELECT pharmacy_id 
           FROM user_pharmacies up
           JOIN public.users u ON u.id = up.user_id
           WHERE u.email = $1
         )
         RETURNING id`,
        [customer.email],
      );

      if (result.rows.length > 0) {
        console.log(
          `✅ Pharmacy ${result.rows[0].id} marked as not endorsed (subscription cancelled)`,
        );
      }
    }
  } catch (error) {
    console.error("Error handling subscription deletion:", error);
    throw error;
  }
}

/**
 * Process payment_intent.succeeded event
 */
async function handlePaymentSucceeded(paymentIntent) {
  console.log(`Processing payment_intent.succeeded: ${paymentIntent.id}`);

  // Add your payment success logic here
  // e.g., update order status, send confirmation email
}

/**
 * Process payment_intent.payment_failed event
 */
async function handlePaymentFailed(paymentIntent) {
  console.log(`Processing payment_intent.payment_failed: ${paymentIntent.id}`);

  // Add your payment failure logic here
  // e.g., notify user, log failure
}

/**
 * Main webhook event processor
 */
async function processStripeWebhook(job) {
  const { eventType, data, eventId } = job.data;

  console.log(`🔄 Processing Stripe webhook: ${eventType} (${eventId})`);

  try {
    switch (eventType) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(data);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(data);
        break;

      case "payment_intent.succeeded":
        await handlePaymentSucceeded(data);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(data);
        break;

      case "invoice.paid":
        console.log(`Invoice paid: ${data.id}`);
        // Add invoice paid logic
        break;

      case "invoice.payment_failed":
        console.log(`Invoice payment failed: ${data.id}`);
        // Add invoice failure logic
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${eventType}`);
    }

    console.log(`✅ Webhook processed successfully: ${eventType} (${eventId})`);
    return { success: true, eventType, eventId };
  } catch (error) {
    console.error(`❌ Error processing webhook ${eventId}:`, error);
    throw error; // BullMQ will retry
  }
}

// Create BullMQ worker
const worker = new Worker("stripe-webhooks", processStripeWebhook, {
  connection: redisConnection,
  concurrency: 5, // Process up to 5 webhooks in parallel
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // Per second
  },
});

// Worker event handlers
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("❌ Worker error:", err);
});

worker.on("ready", () => {
  console.log("🚀 Stripe webhook worker ready and listening for jobs");
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("📴 SIGTERM received, shutting down gracefully...");
  await worker.close();
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("📴 SIGINT received, shutting down gracefully...");
  await worker.close();
  await pool.end();
  process.exit(0);
});

console.log("🎯 Stripe webhook worker started");
