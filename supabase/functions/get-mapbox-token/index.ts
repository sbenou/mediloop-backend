
// Follow this setup guide to integrate the Deno runtime with your project:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log(`Function "get-mapbox-token" up and running!`);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the Mapbox token from environment variable
    const mapboxToken = Deno.env.get("MAPBOX_TOKEN") || 
      'pk.eyJ1IjoiZGVtb2FjY291bnQyMDIwIiwiYSI6ImNrY3M1MHNxcDBrNXAycW1pcngzaGk5cDEifQ.sTh_v9zXhaUXuR2-tUMmVw';

    // Add cache control and CORS headers
    const headers = {
      ...corsHeaders, 
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    };

    console.log("Returning Mapbox token successfully");
    
    // Return the token in a properly formatted JSON object
    return new Response(
      JSON.stringify({ 
        token: mapboxToken,
        status: "success" 
      }),
      { headers, status: 200 }
    );
  } catch (error) {
    console.error("Error in get-mapbox-token function:", error);
    
    // Return a fallback token when there's an error
    const fallbackToken = 'pk.eyJ1IjoiZGVtb2FjY291bnQyMDIwIiwiYSI6ImNrY3M1MHNxcDBrNXAycW1pcngzaGk5cDEifQ.sTh_v9zXhaUXuR2-tUMmVw';
    
    return new Response(
      JSON.stringify({ 
        token: fallbackToken,
        message: "Using fallback token due to error",
        status: "fallback" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Still return 200 with fallback
      }
    );
  }
});
