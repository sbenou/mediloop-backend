
// Follow this setup guide to integrate the Deno runtime with your project:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log(`Function "get-mapbox-token" up and running!`);

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the Mapbox token from environment variable
    const mapboxToken = Deno.env.get("MAPBOX_TOKEN");
    
    // Fallback token if env var isn't set (for development only)
    const fallbackToken = 'pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA';
    
    const tokenToUse = mapboxToken || fallbackToken;

    if (!tokenToUse) {
      throw new Error("No Mapbox token available");
    }

    // Add cache control headers to reduce API calls
    const headers = {
      ...corsHeaders, 
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600" // Cache for 1 hour
    };

    // Log success
    console.log("Returning Mapbox token successfully");
    
    // Return the token
    return new Response(
      JSON.stringify({ token: tokenToUse }),
      { headers, status: 200 }
    );
  } catch (error) {
    console.error("Error in get-mapbox-token function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: "Failed to retrieve Mapbox token" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
