
// Follow this setup guide to integrate the Deno runtime with your project:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log(`Function "get-mapbox-token" up and running!`);

serve(async (req) => {
  // Always include CORS headers in every response
  const headers = {
    ...corsHeaders,
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=86400", // Cache for 24 hours
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    // Get the Mapbox token from environment variable or use reliable public token
    const mapboxToken = Deno.env.get("MAPBOX_ACCESS_TOKEN") || 
      'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

    // Return the token in a properly formatted JSON response
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
    const fallbackToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';
    
    return new Response(
      JSON.stringify({ 
        token: fallbackToken, 
        status: "fallback" 
      }),
      { headers, status: 200 }
    );
  }
});
