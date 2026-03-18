/**
 * Topic Service
 *
 * Manages Firebase FCM topic subscriptions for users.
 * Auto-subscribes users to relevant topics based on role, region, specialty, etc.
 */

import { db } from "../db/connection.ts";
import * as firebaseAdmin from "./firebaseAdminService.ts";

/**
 * Auto-subscribe user to all relevant topics based on their profile
 */
export async function autoSubscribeUserToTopics(
  userId: string,
  fcmToken: string,
) {
  try {
    // Get user profile
    const userResult = await db.query(
      `SELECT role, specialty, region, clinic_id, hospital_id, pharmacy_id 
       FROM public.users WHERE id = $1`,
      [userId],
    );

    if (!userResult.rows[0]) {
      throw new Error(`User ${userId} not found`);
    }

    const user = userResult.rows[0];
    const topics: string[] = [];

    // 1. All users
    topics.push("all_users");

    // 2. Role-based topics
    if (user.role === "doctor") {
      topics.push("doctors_all");
      topics.push("all_healthcare_providers");

      if (user.specialty) {
        topics.push(`doctors_specialty_${user.specialty.toLowerCase()}`);
      }

      if (user.region) {
        topics.push(`doctors_region_${user.region.toLowerCase()}`);
      }
    } else if (user.role === "pharmacist") {
      topics.push("pharmacists_all");
      topics.push("all_healthcare_providers");

      if (user.region) {
        topics.push(`pharmacists_region_${user.region.toLowerCase()}`);
      }
    } else if (user.role === "nurse") {
      topics.push("nurses_all");
      topics.push("all_healthcare_providers");

      if (user.region) {
        topics.push(`nurses_region_${user.region.toLowerCase()}`);
      }
    } else if (user.role === "patient") {
      topics.push("patients_all");

      if (user.region) {
        topics.push(`patients_region_${user.region.toLowerCase()}`);
      }
    } else if (user.role === "hospital_admin") {
      topics.push("hospital_admins_all");
    } else if (user.role === "clinic_admin") {
      topics.push("clinic_admins_all");
    }

    // 3. Workplace-based topics
    if (user.clinic_id) {
      topics.push(`clinic_id_${user.clinic_id}`);
    }

    if (user.hospital_id) {
      topics.push(`hospital_id_${user.hospital_id}`);
    }

    if (user.pharmacy_id) {
      topics.push(`pharmacy_id_${user.pharmacy_id}`);
    }

    // 4. Subscribe to all topics
    console.log(
      `📢 Auto-subscribing user ${userId} to ${topics.length} topics`,
    );

    for (const topic of topics) {
      await firebaseAdmin.subscribeToTopic(fcmToken, topic);

      // Record subscription in database
      await db.query(
        `INSERT INTO topic_subscriptions (user_id, topic, subscribed_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id, topic) DO NOTHING`,
        [userId, topic],
      );
    }

    console.log(`✅ User ${userId} subscribed to topics: ${topics.join(", ")}`);

    return {
      success: true,
      topics,
      message: `Subscribed to ${topics.length} topics`,
    };
  } catch (error: any) {
    console.error(`❌ Failed to auto-subscribe user ${userId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Subscribe user to online status topic (when they go online)
 */
export async function subscribeToOnlineTopic(userId: string, fcmToken: string) {
  try {
    const userResult = await db.query(
      `SELECT role FROM public.users WHERE id = $1`,
      [userId],
    );

    if (!userResult.rows[0]) {
      throw new Error(`User ${userId} not found`);
    }

    const role = userResult.rows[0].role;
    let topic: string | null = null;

    if (role === "doctor") {
      topic = "doctors_online";
    } else if (role === "pharmacist") {
      topic = "pharmacists_online";
    } else if (role === "nurse") {
      topic = "nurses_online";
    }

    if (topic) {
      await firebaseAdmin.subscribeToTopic(fcmToken, topic);

      await db.query(
        `INSERT INTO topic_subscriptions (user_id, topic, subscribed_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id, topic) DO NOTHING`,
        [userId, topic],
      );

      console.log(`✅ User ${userId} subscribed to ${topic}`);

      return {
        success: true,
        topic,
      };
    }

    return {
      success: false,
      error: "User role does not support online topic",
    };
  } catch (error: any) {
    console.error(`❌ Failed to subscribe to online topic:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Unsubscribe from online status topic (when they go offline)
 */
export async function unsubscribeFromOnlineTopic(
  userId: string,
  fcmToken: string,
) {
  try {
    const userResult = await db.query(
      `SELECT role FROM public.users WHERE id = $1`,
      [userId],
    );

    if (!userResult.rows[0]) {
      throw new Error(`User ${userId} not found`);
    }

    const role = userResult.rows[0].role;
    let topic: string | null = null;

    if (role === "doctor") {
      topic = "doctors_online";
    } else if (role === "pharmacist") {
      topic = "pharmacists_online";
    } else if (role === "nurse") {
      topic = "nurses_online";
    }

    if (topic) {
      await firebaseAdmin.unsubscribeFromTopic(fcmToken, topic);

      await db.query(
        `DELETE FROM topic_subscriptions 
         WHERE user_id = $1 AND topic = $2`,
        [userId, topic],
      );

      console.log(`✅ User ${userId} unsubscribed from ${topic}`);

      return {
        success: true,
        topic,
      };
    }

    return {
      success: false,
      error: "User role does not support online topic",
    };
  } catch (error: any) {
    console.error(`❌ Failed to unsubscribe from online topic:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Subscribe user to specific condition/disease topic (for patients)
 */
export async function subscribeToConditionTopic(
  userId: string,
  fcmToken: string,
  condition: string,
) {
  try {
    const topic = `patients_${condition.toLowerCase()}`;

    await firebaseAdmin.subscribeToTopic(fcmToken, topic);

    await db.query(
      `INSERT INTO topic_subscriptions (user_id, topic, subscribed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, topic) DO NOTHING`,
      [userId, topic],
    );

    console.log(`✅ User ${userId} subscribed to condition topic: ${topic}`);

    return {
      success: true,
      topic,
    };
  } catch (error: any) {
    console.error(`❌ Failed to subscribe to condition topic:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Unsubscribe user from specific condition/disease topic
 */
export async function unsubscribeFromConditionTopic(
  userId: string,
  fcmToken: string,
  condition: string,
) {
  try {
    const topic = `patients_${condition.toLowerCase()}`;

    await firebaseAdmin.unsubscribeFromTopic(fcmToken, topic);

    await db.query(
      `DELETE FROM topic_subscriptions 
       WHERE user_id = $1 AND topic = $2`,
      [userId, topic],
    );

    console.log(
      `✅ User ${userId} unsubscribed from condition topic: ${topic}`,
    );

    return {
      success: true,
      topic,
    };
  } catch (error: any) {
    console.error(`❌ Failed to unsubscribe from condition topic:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all topics user is subscribed to
 */
export async function getUserTopics(userId: string) {
  try {
    const result = await db.query(
      `SELECT topic, subscribed_at 
       FROM topic_subscriptions 
       WHERE user_id = $1 
       ORDER BY subscribed_at DESC`,
      [userId],
    );

    return {
      success: true,
      topics: result.rows,
    };
  } catch (error: any) {
    console.error(`❌ Failed to get user topics:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Unsubscribe from all topics (when user logs out or deletes account)
 */
export async function unsubscribeFromAllTopics(
  userId: string,
  fcmToken: string,
) {
  try {
    // Get all user's topics
    const result = await db.query(
      `SELECT topic FROM topic_subscriptions WHERE user_id = $1`,
      [userId],
    );

    const topics = result.rows.map((row: any) => row.topic);

    // Unsubscribe from all topics
    for (const topic of topics) {
      await firebaseAdmin.unsubscribeFromTopic(fcmToken, topic);
    }

    // Remove from database
    await db.query(`DELETE FROM topic_subscriptions WHERE user_id = $1`, [
      userId,
    ]);

    console.log(`✅ User ${userId} unsubscribed from ${topics.length} topics`);

    return {
      success: true,
      unsubscribedCount: topics.length,
    };
  } catch (error: any) {
    console.error(`❌ Failed to unsubscribe from all topics:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}
