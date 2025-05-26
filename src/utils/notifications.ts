
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
  | "new_pharmacy"
  | "connection_request";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  meta?: Record<string, any>;
  tenantId?: string;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  meta,
  tenantId
}: CreateNotificationParams) {
  try {
    // If no tenant ID provided, try to get it from the user's profile
    let finalTenantId = tenantId;
    if (!finalTenantId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', userId)
        .single();
      
      finalTenantId = profile?.tenant_id;
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
        meta,
        tenant_id: finalTenantId
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
  message: string,
  tenantId?: string
) {
  return createNotification({
    userId,
    type,
    title,
    message,
    tenantId
  });
}

// Helper function to create tenant-aware notifications
export async function createTenantNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  meta?: Record<string, any>
) {
  // Get user's tenant ID from their profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single();

  return createNotification({
    userId,
    type,
    title,
    message,
    link,
    meta,
    tenantId: profile?.tenant_id
  });
}
