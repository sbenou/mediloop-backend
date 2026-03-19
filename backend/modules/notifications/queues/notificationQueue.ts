/**
 * Notification Queue
 * Handles reliable processing of notification delivery
 *
 * NOTE: This file defines the queue structure for Deno.
 * Actual job processing happens in workers/ (Node.js with BullMQ)
 */

import {
  createRedisConnection,
  JobPriority,
  QueueNames,
} from "../../../shared/queues/config.ts";

export interface NotificationJobData {
  userId?: string;
  userIds?: string[];
  topic?: string;
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
    data?: Record<string, any>;
    actions?: Array<{ id: string; title: string }>;
    priority?: "high" | "default" | "low";
    sound?: string;
    badge?: number;
  };
  channels?: {
    fcm?: boolean;
    websocket?: boolean;
    database?: boolean;
  };
  scheduledFor?: string;
  createdAt: string;
}

/**
 * Add notification job to queue
 */
export async function addNotificationJob(
  jobType: "send-notification" | "send-to-topic" | "send-to-multiple",
  data: NotificationJobData,
  priority: JobPriority = JobPriority.HIGH,
  delay?: number,
): Promise<void> {
  const redis = await createRedisConnection();

  try {
    const job = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data,
      opts: {
        attempts: 3,
        priority,
        backoff: {
          type: "exponential",
          delay: 1000, // 1s, 2s, 4s
        },
        ...(delay && { delay }),
        timestamp: Date.now(),
      },
    };

    const queueKey = `bull:${QueueNames.NOTIFICATIONS}:wait`;
    await redis.lpush(queueKey, JSON.stringify(job));

    console.log(`✅ Notification job added: ${jobType}`);
  } finally {
    redis.close();
  }
}

/**
 * Get notification queue stats
 */
export async function getNotificationQueueStats() {
  const redis = await createRedisConnection();

  try {
    const queueKey = `bull:${QueueNames.NOTIFICATIONS}:wait`;
    const activeKey = `bull:${QueueNames.NOTIFICATIONS}:active`;
    const completedKey = `bull:${QueueNames.NOTIFICATIONS}:completed`;
    const failedKey = `bull:${QueueNames.NOTIFICATIONS}:failed`;

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

/**
 * Export queue object for use in notificationService
 */
export const notificationQueue = {
  add: async (
    jobType: string,
    data: NotificationJobData,
    options?: { delay?: number },
  ) => {
    const priority =
      data.notification.priority === "high"
        ? JobPriority.HIGH
        : data.notification.priority === "low"
          ? JobPriority.LOW
          : JobPriority.NORMAL;

    await addNotificationJob(jobType as any, data, priority, options?.delay);

    return {
      id: `notification-${Date.now()}`,
    };
  },
};
