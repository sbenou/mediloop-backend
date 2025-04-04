
import { supabase } from "@/lib/supabase";

export async function seedUserNotifications(userId: string) {
  try {
    console.log("Seeding notifications for user:", userId);
    
    // Direct database insertion approach as a workaround for Edge Function issues
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
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();
      
    if (error) {
      console.error("Error seeding notifications:", error);
      return { success: false, error };
    }
    
    return { 
      success: true, 
      count: data.length,
      message: `${data.length} notifications created for user ${userId}`
    };
  } catch (error) {
    console.error("Error seeding notifications:", error);
    return { success: false, error };
  }
}
