/**
 * BullMQ Queue Configuration (UNIFIED - Phase 1 + Phase 2)
 * Shared configuration for all queues (Stripe, Notifications, Emails, etc.)
 */

import { connect } from "https://deno.land/x/redis@v0.32.1/mod.ts";

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  tls?: boolean;
}

/**
 * Get Redis configuration from environment
 */
export function getRedisConfig(): RedisConfig {
  return {
    host: Deno.env.get("REDIS_HOST") || "localhost",
    port: Number(Deno.env.get("REDIS_PORT") || 6379),
    password: Deno.env.get("REDIS_PASSWORD"),
    tls: Deno.env.get("REDIS_TLS") === "true",
  };
}

/**
 * Create Redis connection (for Deno)
 */
export async function createRedisConnection() {
  const config = getRedisConfig();

  const redis = await connect({
    hostname: config.host,
    port: config.port,
    ...(config.password && { password: config.password }),
    ...(config.tls && { tls: true }),
  });

  console.log(`✅ Redis connected: ${config.host}:${config.port}`);

  return redis;
}

/**
 * Queue names - All queues used in the system
 */
export enum QueueNames {
  // Phase 1: Stripe
  STRIPE_WEBHOOKS = "stripe-webhooks",

  // Phase 2: Notifications
  NOTIFICATIONS = "notifications",

  // Future phases
  EMAILS = "emails",
  TELECONSULTATION_REMINDERS = "teleconsultation-reminders",
  PRESCRIPTIONS = "prescriptions",
  WEARABLES = "wearables",
}

/**
 * Job Priority Levels
 */
export enum JobPriority {
  CRITICAL = 1, // Stripe webhooks, emergency notifications
  HIGH = 2, // Appointment reminders, urgent notifications
  NORMAL = 3, // Regular notifications
  LOW = 4, // Marketing emails, non-urgent updates
}

/**
 * Default queue options
 */
export const defaultQueueOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 2000, // 2s, 4s, 8s
  },
  removeOnComplete: {
    age: 86400, // Keep completed jobs for 24 hours
    count: 1000, // Keep max 1000 completed jobs
  },
  removeOnFail: {
    age: 604800, // Keep failed jobs for 7 days
  },
};

/**
 * Export Redis config for Node.js workers
 * (They use ioredis, different format than Deno redis)
 */
export function getNodeRedisConfig() {
  const config = getRedisConfig();

  return {
    host: config.host,
    port: config.port,
    password: config.password,
    tls: config.tls
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false, // Required for BullMQ
  };
}
