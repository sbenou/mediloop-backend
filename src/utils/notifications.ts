
import { supabase } from "@/lib/supabase";

export type NotificationType = 
  | "payment_failed" 
  | "payment_successful" 
  | "delivery_incoming" 
  | "delivery_successful" 
  | "delivery_late" 
  | "delivery_failed" 
  | "prescription_created" 
  | "prescription_updated" 
  | "patient_connected" 
  | "new_user_registered" 
  | "new_subscription" 
  | "new_teleconsultation" 
  | "new_doctor" 
  | "new_pharmacy";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  meta?: Record<string, any>;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  meta
}: CreateNotificationParams) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
        meta
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// Helper function to create a notification for system-level events
export async function createSystemNotification(
  userId: string,
  type: NotificationType, 
  title: string, 
  message: string
) {
  return createNotification({
    userId,
    type,
    title,
    message
  });
}
