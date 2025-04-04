
import { supabase } from "@/lib/supabase";

export async function seedUserNotifications(userId: string) {
  try {
    console.log("Seeding notifications for user:", userId);
    
    // Use the supabase service role client to bypass RLS policies
    const notifications = [
      {
        user_id: userId,
        type: "payment_successful",
        title: "Payment Successful",
        message: "Your payment for order #ORD-2023-001 has been processed",
        read: false
      },
      {
        user_id: userId,
        type: "delivery_incoming",
        title: "Delivery On The Way",
        message: "Your order #ORD-2023-001 is out for delivery",
        read: false
      },
      {
        user_id: userId,
        type: "prescription_created",
        title: "New Prescription",
        message: "Dr. Smith has created a new prescription for you",
        read: true
      },
      {
        user_id: userId,
        type: "delivery_late",
        title: "Delivery Delayed",
        message: "Your delivery #DEL-2023-005 is experiencing a delay",
        read: false
      }
    ];
    
    // Use rpc function call to insert the notifications which bypasses RLS
    // This is safer than using service role credentials in the frontend
    const { data, error } = await supabase.rpc('seed_user_notifications', {
      p_user_id: userId,
      p_notifications: JSON.stringify(notifications)
    });
      
    if (error) {
      console.error("Error seeding notifications:", error);
      return { success: false, error };
    }
    
    return { 
      success: true, 
      count: notifications.length,
      message: `${notifications.length} notifications created for user ${userId}`
    };
  } catch (error) {
    console.error("Error seeding notifications:", error);
    return { success: false, error };
  }
}
