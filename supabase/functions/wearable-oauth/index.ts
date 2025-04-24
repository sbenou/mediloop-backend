
// Follow Supabase Edge Function patterns
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OAUTH_CONFIGS = {
  fitbit: {
    clientId: Deno.env.get("FITBIT_CLIENT_ID") || "",
    clientSecret: Deno.env.get("FITBIT_CLIENT_SECRET") || "",
    authUrl: "https://www.fitbit.com/oauth2/authorize",
    tokenUrl: "https://api.fitbit.com/oauth2/token",
    scope: "activity heartrate sleep profile",
  },
  apple_watch: {
    // Apple Health requires iOS app integration
    // This would be handled through HealthKit in a mobile app
    mockSuccess: true,
  },
  oura_ring: {
    clientId: Deno.env.get("OURA_CLIENT_ID") || "",
    clientSecret: Deno.env.get("OURA_CLIENT_SECRET") || "",
    authUrl: "https://cloud.ouraring.com/oauth/authorize",
    tokenUrl: "https://api.ouraring.com/oauth/token",
    scope: "daily heartrate session",
  },
  garmin: {
    // Garmin requires a registered developer account and app
    mockSuccess: true,
  },
  whoop: {
    clientId: Deno.env.get("WHOOP_CLIENT_ID") || "",
    clientSecret: Deno.env.get("WHOOP_CLIENT_SECRET") || "",
    authUrl: "https://api.prod.whoop.com/oauth/oauth2/auth",
    tokenUrl: "https://api.prod.whoop.com/oauth/oauth2/token",
    scope: "read:profile read:recovery read:workout read:sleep read:body_measurement",
  },
};

// Serve HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const deviceType = url.searchParams.get("device");
    const userId = url.searchParams.get("userId");
    const action = url.searchParams.get("action") || "init";
    
    // Handle different OAuth flows based on device type and action
    if (action === "init" && deviceType && userId) {
      console.log(`Initiating OAuth flow for ${deviceType}`);
      
      // In a real implementation, validate the user exists in your DB
      
      // For demo purposes, we'll simulate a successful connection for all devices
      // In a real implementation, you would redirect to the appropriate OAuth flow
      
      // Generate a mock success response
      return new Response(
        JSON.stringify({
          success: true,
          message: `OAuth flow for ${deviceType} initiated successfully`,
          redirectUrl: url.origin + "/dashboard?oauthSuccess=true&device=" + deviceType,
          // In a real implementation, this would be the actual OAuth authorization URL
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }
    
    // Handle OAuth callback
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      
      // In a real implementation, validate the state parameter and exchange code for tokens
      
      console.log(`OAuth callback received for code ${code?.substring(0, 10)}...`);
      
      // Return success
      return new Response(
        JSON.stringify({
          success: true,
          message: "Device connected successfully",
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    // Return 404 for unsupported paths
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404
      }
    );
    
  } catch (error) {
    console.error("Error in wearable OAuth function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
