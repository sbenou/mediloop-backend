/**
 * Topic Manager
 *
 * Utility functions for managing Firebase topic subscriptions
 * (Most topic management happens automatically on the backend,
 *  but these utilities can be used for special cases)
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Subscribe to condition-based topic (for patients)
 */
export async function subscribeToCondition(
  userId: string,
  condition: string,
  authToken: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_URL}/api/notifications/subscribe-to-topic`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId,
          topic: condition, // e.g., 'diabetes', 'hypertension', 'asthma'
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to subscribe to condition topic");
    }

    console.log(`✅ Subscribed to condition topic: ${condition}`);
    return true;
  } catch (error) {
    console.error(
      `Error subscribing to condition topic "${condition}":`,
      error,
    );
    return false;
  }
}

/**
 * Unsubscribe from condition-based topic
 */
export async function unsubscribeFromCondition(
  userId: string,
  condition: string,
  authToken: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_URL}/api/notifications/unsubscribe-from-topic`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId,
          topic: condition,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to unsubscribe from condition topic");
    }

    console.log(`✅ Unsubscribed from condition topic: ${condition}`);
    return true;
  } catch (error) {
    console.error(
      `Error unsubscribing from condition topic "${condition}":`,
      error,
    );
    return false;
  }
}

/**
 * Get all topics user is subscribed to
 */
export async function getUserTopics(
  userId: string,
  authToken: string,
): Promise<string[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/notifications/topics?userId=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user topics");
    }

    const result = await response.json();

    if (result.success) {
      return result.topics.map((t: any) => t.topic);
    }

    return [];
  } catch (error) {
    console.error("Error fetching user topics:", error);
    return [];
  }
}

/**
 * Common condition topics (for UI selection)
 */
export const COMMON_CONDITIONS = [
  { id: "diabetes", name: "Diabetes", icon: "🩺" },
  { id: "hypertension", name: "Hypertension", icon: "❤️" },
  { id: "asthma", name: "Asthma", icon: "🫁" },
  { id: "heart_disease", name: "Heart Disease", icon: "💔" },
  { id: "arthritis", name: "Arthritis", icon: "🦴" },
  { id: "cancer", name: "Cancer", icon: "🎗️" },
  { id: "copd", name: "COPD", icon: "😮‍💨" },
  { id: "kidney_disease", name: "Kidney Disease", icon: "🫘" },
  { id: "mental_health", name: "Mental Health", icon: "🧠" },
  { id: "allergies", name: "Allergies", icon: "🤧" },
];

/**
 * Example usage in a React Native component:
 *
 * import { subscribeToCondition, COMMON_CONDITIONS } from './utils/topicManager';
 *
 * function ConditionSettings({ user }) {
 *   const handleToggleCondition = async (conditionId: string, isSubscribed: boolean) => {
 *     if (isSubscribed) {
 *       await subscribeToCondition(user.id, conditionId, user.authToken);
 *     } else {
 *       await unsubscribeFromCondition(user.id, conditionId, user.authToken);
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       {COMMON_CONDITIONS.map(condition => (
 *         <Switch
 *           key={condition.id}
 *           value={isSubscribed}
 *           onValueChange={(value) => handleToggleCondition(condition.id, value)}
 *         />
 *       ))}
 *     </View>
 *   );
 * }
 */
