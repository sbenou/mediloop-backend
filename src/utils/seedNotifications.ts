
import { supabase } from "@/lib/supabase";

export async function seedUserNotifications(userId: string) {
  try {
    console.log("Seeding notifications for user:", userId);
    
    // Define the test notifications
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
    
    // First delete existing notifications for the user for clean testing
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) {
      console.error("Error deleting existing notifications:", deleteError);
      // Continue anyway - this is not critical
    }
    
    // Now insert the new notifications
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
      count: notifications.length,
      message: `${notifications.length} notifications created for user ${userId}`
    };
  } catch (error) {
    console.error("Error seeding notifications:", error);
    return { success: false, error };
  }
}
