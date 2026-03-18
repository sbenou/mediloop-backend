/**
 * Stripe Webhook Queue
 * Handles reliable processing of Stripe webhook events
 *
 * NOTE: This file defines the queue structure for Deno.
 * Actual job processing happens in workers/ (Node.js with BullMQ)
 */

import { createRedisConnection, JobPriority, QueueNames } from "./config.ts";

export interface StripeWebhookJobData {
  eventId: string;
  eventType: string;
  data: Record<string, any>;
  timestamp: string;
}

/**
 * Add Stripe webhook job to queue
 */
export async function addStripeWebhookJob(
  data: StripeWebhookJobData,
  priority: JobPriority = JobPriority.CRITICAL,
): Promise<void> {
  const redis = await createRedisConnection();

  try {
    // Create job payload
    const job = {
      id: `stripe-${data.eventId}-${Date.now()}`,
      data,
      opts: {
        attempts: 5, // Critical: retry 5 times
        priority,
        backoff: {
          type: "exponential",
          delay: 2000, // 2s, 4s, 8s, 16s, 32s
        },
        timestamp: Date.now(),
      },
    };

    // Add to Redis list (BullMQ format)
    const queueKey = `bull:${QueueNames.STRIPE_WEBHOOKS}:wait`;
    await redis.lpush(queueKey, JSON.stringify(job));

    console.log(
      `✅ Stripe webhook job added: ${data.eventType} (${data.eventId})`,
    );
  } finally {
    redis.close();
  }
}

/**
 * Get Stripe queue stats
 */
export async function getStripeQueueStats() {
  const redis = await createRedisConnection();

  try {
    const queueKey = `bull:${QueueNames.STRIPE_WEBHOOKS}:wait`;
    const activeKey = `bull:${QueueNames.STRIPE_WEBHOOKS}:active`;
    const completedKey = `bull:${QueueNames.STRIPE_WEBHOOKS}:completed`;
    const failedKey = `bull:${QueueNames.STRIPE_WEBHOOKS}:failed`;

    const [waiting, active, completed, failed] = await Promise.all([
      redis.llen(queueKey),
      redis.llen(activeKey),
      redis.scard(completedKey),
      redis.scard(failedKey),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  } finally {
    redis.close();
  }
}
