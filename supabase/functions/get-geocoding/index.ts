import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface GeocodeRequest {
  query: string;
  types?: string;
  limit?: number;
}

interface ReverseGeocodeRequest {
  longitude: number;
  latitude: number;
}

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get the Mapbox access token from environment variables
    const mapboxToken = Deno.env.get("MAPBOX_ACCESS_TOKEN");
    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ error: "Mapbox token not configured" }),
        {
          status: 500,
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          },
        }
      );
    }

    // Parse the request body
    const requestData = await req.json();
    
    // Check if this is a reverse geocoding request
    if (requestData.longitude !== undefined && requestData.latitude !== undefined) {
      return handleReverseGeocode(requestData, mapboxToken, corsHeaders);
    } 
    
    // Otherwise, handle it as a forward geocoding request
    return handleForwardGeocode(requestData, mapboxToken, corsHeaders);
  } catch (error) {
    console.error("Error in geocoding function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process geocoding request" }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      }
    );
  }
});

async function handleForwardGeocode(data: GeocodeRequest, mapboxToken: string, corsHeaders: HeadersInit) {
  const { query, types = "", limit = 5 } = data;
  
  if (!query) {
    return new Response(
      JSON.stringify({ error: "Query parameter is required" }),
      {
        status: 400,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      }
    );
  }

  // Construct the Mapbox Geocoding API URL
  const typeParam = types ? `&types=${types}` : "";
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query
  )}.json?access_token=${mapboxToken}${typeParam}&limit=${limit}`;

  console.log(`Making forward geocoding request for: ${query}`);

  // Make the request to the Mapbox API
  const response = await fetch(url);
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { 
      ...corsHeaders,
      "Content-Type": "application/json" 
    },
  });
}

async function handleReverseGeocode(data: ReverseGeocodeRequest, mapboxToken: string, corsHeaders: HeadersInit) {
  const { longitude, latitude } = data;
  
  // Construct the Mapbox Reverse Geocoding API URL
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`;

  console.log(`Making reverse geocoding request for: ${latitude},${longitude}`);

  // Make the request to the Mapbox API
  const response = await fetch(url);
  const responseData = await response.json();

  return new Response(JSON.stringify(responseData), {
    headers: { 
      ...corsHeaders,
      "Content-Type": "application/json" 
    },
  });
}
