
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Working Mapbox tokens for fallback
const FALLBACK_TOKEN = 'pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Mapbox token from environment variables
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN') || FALLBACK_TOKEN;

    console.log('Returning Mapbox token from edge function');
    
    // Return the token as JSON with proper headers
    return new Response(
      JSON.stringify({ token: mapboxToken }),
      { 
        status: 200, 
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Error getting Mapbox token:', error);
    
    // Return fallback token in case of any error
    return new Response(
      JSON.stringify({ 
        token: FALLBACK_TOKEN,
        error: error.message,
        fallback: true
      }),
      { 
        status: 200, 
        headers: corsHeaders
      }
    );
  }
});
