
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
      
      // Get the device configuration
      const config = OAUTH_CONFIGS[deviceType as keyof typeof OAUTH_CONFIGS];
      
      if (!config) {
        return new Response(
          JSON.stringify({ error: `Unsupported device type: ${deviceType}` }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400
          }
        );
      }
      
      // For devices that can only be connected through mobile apps
      if (config.mockSuccess) {
        return new Response(
          JSON.stringify({
            success: true,
            message: `${deviceType} requires mobile app connection. For demo purposes, we'll simulate success.`,
            redirectUrl: url.origin + "/dashboard?oauthSuccess=true&device=" + deviceType,
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
          }
        );
      }
      
      // Ensure we have required credentials
      if (!config.clientId || !config.clientSecret) {
        return new Response(
          JSON.stringify({ 
            error: `Missing OAuth credentials for ${deviceType}. Please check environment variables.` 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
          }
        );
      }

      // Generate state parameter to prevent CSRF
      const state = crypto.randomUUID();
      
      // Store state in cookie or database for verification during callback
      // For simplicity, we're including userId in state, but in production
      // you'd want to store this mapping in a database
      const stateWithUser = `${state}|${userId}`;
      const encodedState = btoa(stateWithUser);
      
      // Build callback URL
      const callbackUrl = `${url.origin}/api/wearable-oauth?action=callback&device=${deviceType}`;
      
      // Build the authorization URL
      const authUrlWithParams = new URL(config.authUrl);
      authUrlWithParams.searchParams.append("client_id", config.clientId);
      authUrlWithParams.searchParams.append("response_type", "code");
      authUrlWithParams.searchParams.append("scope", config.scope);
      authUrlWithParams.searchParams.append("redirect_uri", callbackUrl);
      authUrlWithParams.searchParams.append("state", encodedState);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Redirecting to ${deviceType} for authorization`,
          redirectUrl: authUrlWithParams.toString(),
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
      const deviceType = url.searchParams.get("device");
      
      if (!code || !state || !deviceType) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400
          }
        );
      }
      
      // Decode state to get user ID
      let userId;
      try {
        const decodedState = atob(state);
        [, userId] = decodedState.split('|');
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Invalid state parameter" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400
          }
        );
      }
      
      // Get device config
      const config = OAUTH_CONFIGS[deviceType as keyof typeof OAUTH_CONFIGS];
      
      if (!config || config.mockSuccess) {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: "Device connected successfully (mock)",
            redirectUrl: url.origin + "/dashboard?oauthSuccess=true&device=" + deviceType 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
          }
        );
      }
      
      // Exchange code for tokens
      try {
        // Build callback URL - must match the one used in authorization request
        const callbackUrl = `${url.origin}/api/wearable-oauth?action=callback&device=${deviceType}`;
        
        // Prepare the token request
        const tokenRequestData = new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        });
        
        // Send token request
        const tokenResponse = await fetch(config.tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: tokenRequestData.toString(),
        });
        
        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
          throw new Error(tokenData.error || "Failed to exchange code for token");
        }
        
        // Store tokens in database - this would normally be done server-side
        // through a secure endpoint
        // For demo purposes, we're returning success
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Device connected successfully",
            redirectUrl: url.origin + "/dashboard?oauthSuccess=true&device=" + deviceType,
            // Include the tokens in the response - in production, you wouldn't do this
            // You'd store them securely in a database
            // This is just for demonstration
            tokens: tokenData,
            userId,
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
          }
        );
      } catch (error) {
        console.error("Error exchanging code for token:", error);
        return new Response(
          JSON.stringify({ error: "Failed to complete OAuth flow: " + error.message }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
          }
        );
      }
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
