
import { Notification } from "@/types/supabase";
import { Activity } from "@/hooks/activity/types";

/**
 * Adapts notifications to be compatible with the Activity interface
 * This makes it easier to use notifications in components that expect Activity objects
 */
export const adaptNotificationsToActivityFormat = (notifications: Notification[]): Activity[] => {
  return notifications.map(notification => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    description: notification.message,
    timestamp: notification.created_at,
    read: notification.read,
    user_id: notification.user_id,
    metadata: notification.meta,
    // Add any other required fields with sensible defaults
    status: notification.read ? 'read' : 'unread',
  }));
};

