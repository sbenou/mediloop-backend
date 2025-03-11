
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface GeocodeRequest {
  query: string;
  types?: string;
  limit?: number;
}

serve(async (req) => {
  try {
    // Get the Mapbox access token from environment variables
    const mapboxToken = Deno.env.get("MAPBOX_ACCESS_TOKEN");
    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ error: "Mapbox token not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse the request body to get the search query
    const { query, types = "", limit = 5 } = await req.json() as GeocodeRequest;
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Construct the Mapbox Geocoding API URL
    const typeParam = types ? `&types=${types}` : "";
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${mapboxToken}${typeParam}&limit=${limit}`;

    // Make the request to the Mapbox API
    const response = await fetch(url);
    const data = await response.json();

    // Return the geocoding results
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in geocoding function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process geocoding request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
