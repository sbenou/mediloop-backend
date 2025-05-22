
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createRemoteJWTCredential } from "https://cdn.jsdelivr.net/npm/firebase-admin@11.10.1/lib/esm/app/credential.js";

interface FirebaseMessage {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
}

const PROJECT_ID = "mediloop-6b3d3";

// Get credentials from environment variables
const SERVICE_ACCOUNT = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") || "{}");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Make sure the request is authorized
    if (!req.headers.get("Authorization")) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the request body
    const { token, notification, data } = await req.json() as FirebaseMessage;

    if (!token) {
      return new Response(JSON.stringify({ error: "No FCM token provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if service account is configured
    if (!SERVICE_ACCOUNT.private_key) {
      return new Response(JSON.stringify({ error: "Firebase service account not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get an access token using the service account
    const credential = createRemoteJWTCredential(SERVICE_ACCOUNT);
    const accessToken = await credential.getAccessToken();

    if (!accessToken) {
      throw new Error("Failed to get access token from Firebase credentials");
    }

    // Create the FCM message
    const message = {
      message: {
        token,
        notification,
        data: data || {},
        android: {
          priority: "high",
        },
        apns: {
          headers: {
            "apns-priority": "10",
          },
        },
      },
    };

    console.log("Sending Firebase notification to token:", token.substring(0, 10) + "...");

    // Send to Firebase
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(message),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firebase error ${response.status}:`, errorText);
      throw new Error(`Firebase error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("Firebase notification sent successfully:", result);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending Firebase notification:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
