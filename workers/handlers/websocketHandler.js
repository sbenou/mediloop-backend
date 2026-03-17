/**
 * WebSocket Handler
 * Delivers real-time notifications to web browsers
 *
 * NOTE: This handler makes HTTP requests to your Deno backend's
 * internal WebSocket broadcasting endpoint.
 */

import dotenv from "dotenv";

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

/**
 * Send notification via WebSocket (through backend)
 */
export async function sendViaWebSocket({ userId, notification }) {
  try {
    // Make HTTP request to backend's internal WebSocket broadcast endpoint
    const response = await fetch(`${BACKEND_URL}/internal/websocket/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": process.env.INTERNAL_API_SECRET || "dev-secret",
      },
      body: JSON.stringify({
        userId,
        notification,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ WebSocket delivery failed for user ${userId}:`, error);
      return { success: false, error };
    }

    const result = await response.json();

    if (result.success) {
      console.log(`✅ WebSocket notification sent to user ${userId}`);
    } else {
      console.log(
        `⚠️ WebSocket delivery failed for user ${userId}: ${result.reason}`,
      );
    }

    return result;
  } catch (error) {
    console.error(
      `❌ Error sending WebSocket notification to user ${userId}:`,
      error,
    );

    // WebSocket failure is not critical - user can see notification when they refresh
    // So we don't throw here, just log the error
    return { success: false, error: error.message };
  }
}
