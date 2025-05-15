
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
    
    // Use a reliable fallback token
    const fallbackToken = 'pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA';
    
    const tokenToUse = mapboxToken || fallbackToken;

    if (!tokenToUse) {
      throw new Error("No Mapbox token available");
    }

    // Add cache control and CORS headers
    const headers = {
      ...corsHeaders, 
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    };

    console.log("Returning Mapbox token successfully");
    
    // Return the token in a simple format
    return new Response(
      JSON.stringify({ 
        token: tokenToUse,
        status: "success" 
      }),
      { headers, status: 200 }
    );
  } catch (error) {
    console.error("Error in get-mapbox-token function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: "Failed to retrieve Mapbox token",
        status: "error" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
