
import { createNotification, NotificationType } from "@/utils/notifications";
import { supabase } from "@/lib/supabase";
import { useTenantSupabase } from "@/hooks/useTenantSupabase";
import { useCallback } from "react";
import { sendDoctorConnectionFirebaseNotification } from "./firebaseNotifications";

// Helper function to send doctor connection notifications
export async function sendDoctorConnectionNotification(doctorId: string, patientName: string) {
  try {
    // Get doctor profile
    const { data: doctorProfile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', doctorId)
      .single();
    
    if (!doctorProfile) return null;
    
    // Create notification for doctor in the app database
    const notification = await createNotification({
      userId: doctorId,
      type: "patient_connected",
      title: "New Patient Connection Request",
      message: `${patientName} has requested to connect with you as a patient.`,
      link: "/dashboard?section=patients&profileTab=active",
      meta: {
        patientName,
        timestamp: new Date().toISOString()
      }
    });
    
    // Also send Firebase notification
    await sendDoctorConnectionFirebaseNotification(doctorId, patientName);
    
    return notification;
  } catch (error) {
    console.error('Error sending doctor connection notification:', error);
    return null;
  }
}

// Helper function to send purchase notifications
export async function sendPurchaseNotification(userId: string, orderTotal: number, orderId: string) {
  try {
    return createNotification({
      userId,
      type: "payment_successful",
      title: "Purchase Completed",
      message: `Your order for €${orderTotal.toFixed(2)} has been successfully processed.`,
      link: `/dashboard?section=orders&orderId=${orderId}`,
      meta: {
        orderId,
        amount: orderTotal,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending purchase notification:', error);
    return null;
  }
}

// Helper function to send referral notifications
export async function sendReferralNotification(userId: string, points: number) {
  try {
    return createNotification({
      userId,
      type: "new_subscription",
      title: "Referral Reward Earned",
      message: `Congratulations! You've earned ${points} points from your referral.`,
      link: "/loyalty",
      meta: {
        points,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending referral notification:', error);
    return null;
  }
}

// Helper function to send referral conversion notifications
export async function sendReferralConversionNotification(referrerId: string, points: number) {
  try {
    return createNotification({
      userId: referrerId,
      type: "new_subscription",
      title: "Referral Converted!",
      message: `Great news! Your referral has subscribed and you've earned ${points} bonus points.`,
      link: "/loyalty",
      meta: {
        points,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending referral conversion notification:', error);
    return null;
  }
}

// Tenant-aware notification hooks
export function useTenantNotifications() {
  const { tenantTable, currentTenant } = useTenantSupabase();
  
  const sendTenantDoctorConnectionNotification = useCallback(async (doctorId: string, patientName: string) => {
    if (!currentTenant) {
      return sendDoctorConnectionNotification(doctorId, patientName);
    }
    
    try {
      // Get doctor profile from tenant schema
      const { data: doctorProfile, error } = await supabase
        .from(`${currentTenant.schema}.profiles`)
        .select('id, full_name, email')
        .eq('id', doctorId)
        .single();
      
      if (error || !doctorProfile) {
        console.error(`Could not find doctor profile in tenant ${currentTenant.name}:`, error);
        return null;
      }
      
      // Create notification in tenant schema
      const { data: notification, error: notifError } = await supabase
        .from(`${currentTenant.schema}.notifications`)
        .insert({
          user_id: doctorId,
          type: "patient_connected",
          title: "New Patient Connection Request",
          message: `${patientName} has requested to connect with you as a patient.`,
          link: "/dashboard?section=patients&profileTab=active",
          meta: {
            patientName,
            timestamp: new Date().toISOString(),
            tenantId: currentTenant.id,
            tenantName: currentTenant.name
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (notifError) {
        console.error(`Error creating notification in tenant ${currentTenant.name}:`, notifError);
        return null;
      }
      
      // Also send Firebase notification
      await sendDoctorConnectionFirebaseNotification(doctorId, patientName);
      
      return notification;
    } catch (error) {
      console.error(`Error sending tenant doctor connection notification for ${currentTenant.name}:`, error);
      return null;
    }
  }, [tenantTable, currentTenant]);
  
  const sendTenantPurchaseNotification = useCallback(async (userId: string, orderTotal: number, orderId: string) => {
    if (!currentTenant) {
      return sendPurchaseNotification(userId, orderTotal, orderId);
    }
    
    try {
      const { data: notification, error } = await supabase
        .from(`${currentTenant.schema}.notifications`)
        .insert({
          user_id: userId,
          type: "payment_successful",
          title: "Purchase Completed",
          message: `Your order for €${orderTotal.toFixed(2)} has been successfully processed.`,
          link: `/dashboard?section=orders&orderId=${orderId}`,
          meta: {
            orderId,
            amount: orderTotal,
            timestamp: new Date().toISOString(),
            tenantId: currentTenant.id,
            tenantName: currentTenant.name
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error(`Error creating purchase notification in tenant ${currentTenant.name}:`, error);
        return null;
      }
      
      return notification;
    } catch (error) {
      console.error(`Error sending tenant purchase notification for ${currentTenant.name}:`, error);
      return null;
    }
  }, [tenantTable, currentTenant]);
  
  return {
    sendTenantDoctorConnectionNotification,
    sendTenantPurchaseNotification
  };
}
