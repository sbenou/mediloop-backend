/**
 * Notification History Handler
 * Saves notifications to database for history/archive
 */

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection
const DATABASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL_PROD
    : process.env.DATABASE_URL_DEV;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

/**
 * Save notification to database
 */
export async function saveToDatabase({ userId, notification, topic }) {
  try {
    const result = await pool.query(
      `INSERT INTO notifications 
       (user_id, tenant_id, title, body, data, image_url, channels, topic, priority, actions, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING id`,
      [
        userId || null,
        null, // tenant_id - populate if you have multi-tenancy
        notification.title,
        notification.body,
        notification.data ? JSON.stringify(notification.data) : null,
        notification.imageUrl || null,
        ["fcm", "websocket", "database"], // channels used
        topic || null,
        notification.priority || "default",
        notification.actions ? JSON.stringify(notification.actions) : null,
      ],
    );

    const notificationId = result.rows[0].id;

    console.log(`✅ Notification saved to database: ${notificationId}`);

    return { success: true, notificationId };
  } catch (error) {
    console.error(`❌ Error saving notification to database:`, error);

    // Database save failure is not critical - notification was already delivered
    // So we don't throw here, just log the error
    return { success: false, error: error.message };
  }
}
