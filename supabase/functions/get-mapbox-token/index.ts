
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
    
    if (!mapboxToken) {
      throw new Error("MAPBOX_TOKEN environment variable is not set");
    }

    // Return the token
    return new Response(
      JSON.stringify({ token: mapboxToken }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});

