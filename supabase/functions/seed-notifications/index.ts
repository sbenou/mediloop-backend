
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.16";

type NotificationType = 
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

interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at?: string;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // First check if the user exists
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // First delete existing notifications for the user for clean testing
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user_id);
      
    if (deleteError) {
      console.error("Error deleting existing notifications:", deleteError);
      // Continue anyway - this is not critical
    }

    // Generate mock notifications based on role
    let mockNotifications: NotificationData[] = [];
    const role = user.role;
    
    if (role === 'doctor') {
      mockNotifications = [
        {
          type: "patient_connected",
          title: "New Patient Connection",
          message: "Patient John Doe has connected with you",
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          type: "prescription_created",
          title: "Prescription Sent",
          message: "Prescription #PR-2023-001 for patient Jane Smith has been sent",
          read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        }
      ];
    } else if (role === 'pharmacist') {
      mockNotifications = [
        {
          type: "prescription_created",
          title: "New Prescription",
          message: "Dr. Smith has sent a new prescription for patient Jane Doe",
          read: false,
          created_at: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          type: "payment_successful",
          title: "Payment Successful",
          message: "Payment for order #ORD-2023-001 has been completed",
          read: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        }
      ];
    } else if (role === 'superadmin') {
      mockNotifications = [
        {
          type: "new_user_registered",
          title: "New User Registration",
          message: "John Doe has registered as a new patient",
          read: false,
          created_at: new Date(Date.now() - 900000).toISOString(),
        },
        {
          type: "new_doctor",
          title: "New Doctor Enrolled",
          message: "Dr. Emily Johnson has enrolled as a doctor",
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          type: "new_pharmacy",
          title: "New Pharmacy Enrolled",
          message: "MediCare Pharmacy has been registered",
          read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        }
      ];
    } else { // Default patient notifications
      mockNotifications = [
        {
          type: "payment_successful",
          title: "Payment Successful",
          message: "Your payment for order #ORD-2023-001 has been processed",
          read: false,
          created_at: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          type: "delivery_incoming",
          title: "Delivery On The Way",
          message: "Your order #ORD-2023-001 is out for delivery",
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          type: "prescription_created",
          title: "New Prescription",
          message: "Dr. Smith has created a new prescription for you",
          read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        }
      ];
    }

    // Insert the mock notifications
    const notificationsToInsert = mockNotifications.map(notification => ({
      user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      created_at: notification.created_at
    }));

    const { data, error } = await supabase
      .from("notifications")
      .insert(notificationsToInsert)
      .select();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${data.length} notifications created for user ${user_id}`,
        count: data.length,
        data 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
