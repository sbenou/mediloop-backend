/**
 * Notification Worker (Node.js)
 * Processes notification delivery jobs from BullMQ queue
 */

import { Worker } from "bullmq";
import dotenv from "dotenv";
import { sendViaFCM } from "./handlers/fcmHandler.js";
import { sendViaWebSocket } from "./handlers/websocketHandler.js";
import { saveToDatabase } from "./handlers/notificationHistoryHandler.js";

dotenv.config();

// Redis connection config for BullMQ
const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

/**
 * Process notification job
 */
async function processNotification(job) {
  const { userId, userIds, topic, notification, channels } = job.data;

  console.log(`🔄 Processing notification job: ${job.id}`);
  console.log(`   Type: ${topic ? "topic" : userIds ? "multiple" : "single"}`);
  console.log(
    `   Channels: FCM=${channels?.fcm}, WebSocket=${channels?.websocket}, DB=${channels?.database}`,
  );

  const results = {
    fcm: null,
    websocket: null,
    database: null,
  };

  try {
    // 1. Send via Firebase Cloud Messaging (mobile)
    if (channels?.fcm !== false) {
      if (topic) {
        results.fcm = await sendViaFCM({ topic, notification });
      } else if (userIds) {
        results.fcm = await sendViaFCM({ userIds, notification });
      } else if (userId) {
        results.fcm = await sendViaFCM({ userId, notification });
      }
    }

    // 2. Send via WebSocket (web real-time)
    if (channels?.websocket !== false && !topic) {
      if (userIds) {
        results.websocket = await Promise.all(
          userIds.map((id) => sendViaWebSocket({ userId: id, notification })),
        );
      } else if (userId) {
        results.websocket = await sendViaWebSocket({ userId, notification });
      }
    }

    // 3. Save to database (notification history)
    if (channels?.database !== false && !topic) {
      if (userIds) {
        results.database = await Promise.all(
          userIds.map((id) =>
            saveToDatabase({
              userId: id,
              notification,
              topic: null,
            }),
          ),
        );
      } else if (userId) {
        results.database = await saveToDatabase({
          userId,
          notification,
          topic: null,
        });
      }
    } else if (topic && channels?.database !== false) {
      // Save topic notification to database with null userId
      results.database = await saveToDatabase({
        userId: null,
        notification,
        topic,
      });
    }

    console.log(`✅ Notification processed successfully: ${job.id}`);
    console.log(`   FCM: ${results.fcm ? "sent" : "skipped"}`);
    console.log(`   WebSocket: ${results.websocket ? "sent" : "skipped"}`);
    console.log(`   Database: ${results.database ? "saved" : "skipped"}`);

    return { success: true, results };
  } catch (error) {
    console.error(`❌ Error processing notification job ${job.id}:`, error);
    throw error; // BullMQ will retry
  }
}

// Create BullMQ worker
const worker = new Worker("notifications", processNotification, {
  connection: redisConnection,
  concurrency: 10, // Process up to 10 notifications in parallel
  limiter: {
    max: 100, // Max 100 jobs
    duration: 1000, // Per second
  },
});

// Worker event handlers
worker.on("completed", (job) => {
  console.log(`✅ Notification job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Notification job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("❌ Notification worker error:", err);
});

worker.on("ready", () => {
  console.log("🚀 Notification worker ready and listening for jobs");
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("📴 SIGTERM received, shutting down notification worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("📴 SIGINT received, shutting down notification worker...");
  await worker.close();
  process.exit(0);
});

console.log("🎯 Notification worker started");

export default worker;
