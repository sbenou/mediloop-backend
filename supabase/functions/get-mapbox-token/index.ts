
// Follow this setup guide to integrate the Deno runtime with your project:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
  'Content-Type': 'application/json'
};

console.log(`Function "get-mapbox-token" up and running!`);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('', { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Get the Mapbox token from environment variable or use reliable public token
    const mapboxToken = Deno.env.get("MAPBOX_ACCESS_TOKEN") || 
      'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

    // Construct the response JSON - ensure it's properly formatted
    const responseData = JSON.stringify({
      token: mapboxToken,
      status: "success"
    });

    // Return the token in a properly formatted JSON response
    return new Response(responseData, { 
      headers: corsHeaders,
      status: 200
    });
  } catch (error) {
    console.error("Error in get-mapbox-token function:", error);
    
    // Return a fallback token when there's an error
    const fallbackToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
    
    // Construct the error JSON response - ensure proper formatting
    const responseData = JSON.stringify({
      token: fallbackToken,
      status: "fallback",
      error: error instanceof Error ? error.message : "Unknown error"
    });
    
    return new Response(responseData, { 
      headers: corsHeaders,
      status: 200  // Still return 200 to make it easier for clients to handle
    });
  }
});
