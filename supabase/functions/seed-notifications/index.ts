
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.16";

// CORS headers to allow requests from any origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Create a Supabase client
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(supabaseUrl, supabaseKey);
}

// Handle CORS preflight requests
function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }
  return null;
}

// Validate user exists
async function validateUser(supabase: any, userId: string) {
  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    console.error("User not found:", userError);
    throw new Error("User not found");
  }

  return user;
}

// Generate notifications based on user role
function generateRoleBasedNotifications(role: string): NotificationData[] {
  console.log("Generating notifications for role:", role);
  
  if (role === 'doctor') {
    return [
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
  } 
  else if (role === 'pharmacist') {
    return [
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
  } 
  else if (role === 'superadmin') {
    return [
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
      },
      // Adding alert notifications for superadmin
      {
        type: "payment_failed",
        title: "Payment Processing Failed",
        message: "Payment gateway error for transaction #TX-2023-096",
        read: false,
        created_at: new Date(Date.now() - 1200000).toISOString(),
      },
      {
        type: "delivery_failed",
        title: "Delivery Failure Alert",
        message: "Multiple delivery failures reported in Lyon region",
        read: false,
        created_at: new Date(Date.now() - 3000000).toISOString(),
      }
    ];
  } 
  else { // Default patient notifications
    return [
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
      },
      // Adding alerts for patient role
      {
        type: "payment_failed",
        title: "Payment Failed",
        message: "Your payment for prescription #PRE-2023-042 was declined",
        read: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        type: "delivery_late",
        title: "Delivery Delayed",
        message: "Your delivery for order #ORD-2023-078 is running late",
        read: false,
        created_at: new Date(Date.now() - 10000000).toISOString(),
      }
    ];
  }
}

// Clean existing notifications for the user
async function cleanExistingNotifications(supabase: any, userId: string) {
  const { error: deleteError } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);
    
  if (deleteError) {
    console.error("Error deleting existing notifications:", deleteError);
    // Continue anyway - this is not critical
  }
}

// Insert notifications into the database
async function insertNotifications(supabase: any, userId: string, notifications: NotificationData[]) {
  const notificationsToInsert = notifications.map(notification => ({
    user_id: userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    created_at: notification.created_at
  }));

  console.log(`Inserting ${notificationsToInsert.length} notifications for user ${userId}`);
  
  const { data, error } = await supabase
    .from("notifications")
    .insert(notificationsToInsert)
    .select();

  if (error) {
    console.error("Error inserting notifications:", error);
    throw error;
  }

  return data;
}

// Create success response
function createSuccessResponse(data: any, userId: string) {
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `${data.length} notifications created for user ${userId}`,
      count: data.length,
      data 
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Create error response
function createErrorResponse(error: any, status = 500) {
  console.error("Error in seed notifications function:", error);
  return new Response(
    JSON.stringify({ error: error.message || "An unexpected error occurred" }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Main handler function
serve(async (req) => {
  console.log("Seed notifications function called");
  
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  try {
    // Create a Supabase client
    const supabase = createSupabaseClient();

    // Parse request body
    const { user_id } = await req.json();
    console.log("User ID received:", user_id);

    if (!user_id) {
      return createErrorResponse({ message: "User ID is required" }, 400);
    }

    // Verify user exists and get role
    const user = await validateUser(supabase, user_id);

    // Delete existing notifications for clean testing
    await cleanExistingNotifications(supabase, user_id);

    // Generate mock notifications based on role
    const mockNotifications = generateRoleBasedNotifications(user.role);

    // Insert the mock notifications
    const data = await insertNotifications(supabase, user_id, mockNotifications);

    console.log(`Successfully inserted ${data.length} notifications`);
    
    // Return success response
    return createSuccessResponse(data, user_id);
    
  } catch (error) {
    return createErrorResponse(error);
  }
});
