/**
 * Main Worker Entry Point
 * Starts all BullMQ workers for background job processing
 */

import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("🚀 Starting Mediloop Workers...");
console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`📍 Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
console.log(
  `📍 Database: ${process.env.DATABASE_URL ? "✅ Connected" : "❌ Not configured"}`,
);

// Import workers (each worker starts automatically when imported)
import "./stripeWorker.js";
// import './notificationWorker.js'; // Will add in next phase
// import './emailWorker.js'; // Will add in next phase

console.log("✅ All workers started successfully");
console.log("⏳ Waiting for jobs...\n");

// Keep process alive
process.on("SIGTERM", () => {
  console.log("📴 Shutting down workers...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("📴 Shutting down workers...");
  process.exit(0);
});
