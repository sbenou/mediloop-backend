
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.16";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(supabaseUrl, supabaseKey);
}

// Firebase Admin SDK setup
async function getFirebaseAdminApp() {
  const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}");
  
  // Use Firebase Admin REST API instead of SDK for edge functions
  return {
    messaging: {
      send: async (message: any) => {
        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${await getAccessToken(serviceAccount)}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
          }
        );
        return response.json();
      }
    }
  };
}

// Get OAuth2 access token for Firebase
async function getAccessToken(serviceAccount: any) {
  const jwt = await createJWT(serviceAccount);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  
  const data = await response.json();
  return data.access_token;
}

// Create JWT for Firebase authentication
async function createJWT(serviceAccount: any) {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(payload));
  const signatureInput = `${headerB64}.${payloadB64}`;
  
  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
  
  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(signatureInput)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${signatureInput}.${signatureB64}`;
}

// Send Firebase push notification
async function sendPushNotification(fcmToken: string, title: string, body: string, data?: any) {
  try {
    const firebaseAdmin = await getFirebaseAdminApp();
    
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        notification: {
          channelId: 'connection_requests',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            badge: 1,
            sound: 'default',
          },
        },
      },
    };
    
    const result = await firebaseAdmin.messaging.send(message);
    console.log('Push notification sent successfully:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}

// Process connection request notification
async function processConnectionRequest(doctorId: string, patientName: string) {
  const supabase = createSupabaseClient();
  
  try {
    console.log(`Processing connection request: Doctor ${doctorId}, Patient ${patientName}`);
    
    // 1. Create in-app notification
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: doctorId,
        type: 'connection_request',
        title: 'New Patient Connection Request',
        message: `${patientName} has requested to connect with you as a patient.`,
        link: '/dashboard?section=patients&profileTab=active',
        meta: {
          patientName,
          timestamp: new Date().toISOString(),
          source: 'background_job'
        },
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      throw new Error(`Failed to create notification: ${notificationError.message}`);
    }
    
    console.log('In-app notification created:', notification);
    
    // 2. Get doctor's FCM tokens for push notifications
    const { data: fcmTokens, error: tokenError } = await supabase
      .from('user_notification_tokens')
      .select('token')
      .eq('user_id', doctorId)
      .eq('platform', 'web');
    
    if (tokenError) {
      console.error('Error fetching FCM tokens:', tokenError);
    }
    
    // 3. Send push notifications to all doctor's devices
    const pushResults = [];
    if (fcmTokens && fcmTokens.length > 0) {
      for (const tokenRecord of fcmTokens) {
        const pushResult = await sendPushNotification(
          tokenRecord.token,
          'New Patient Connection Request',
          `${patientName} wants to connect with you`,
          {
            type: 'connection_request',
            doctorId,
            patientName,
            notificationId: notification.id
          }
        );
        pushResults.push(pushResult);
      }
      console.log('Push notification results:', pushResults);
    } else {
      console.log('No FCM tokens found for doctor, skipping push notifications');
    }
    
    return {
      success: true,
      notification,
      pushResults,
      message: `Connection request notification processed successfully for doctor ${doctorId}`
    };
    
  } catch (error) {
    console.error('Error processing connection request:', error);
    throw error;
  }
}

// Main handler
serve(async (req) => {
  console.log("Connection notification processor called");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    const { doctorId, patientName } = await req.json();
    
    if (!doctorId || !patientName) {
      return new Response(
        JSON.stringify({ error: 'doctorId and patientName are required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const result = await processConnectionRequest(doctorId, patientName);
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in connection notification processor:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
