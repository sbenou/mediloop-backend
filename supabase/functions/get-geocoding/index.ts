
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface GeocodingRequest {
  address: string;
}

serve(async (req) => {
  try {
    // Extract the API key from environment variables
    const mapboxApiKey = Deno.env.get("MAPBOX_API_KEY") || "";
    
    if (!mapboxApiKey) {
      return new Response(
        JSON.stringify({ error: "Mapbox API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse the request body to get the address
    const { address }: GeocodingRequest = await req.json();
    
    if (!address) {
      return new Response(
        JSON.stringify({ error: "Address is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call the Mapbox Geocoding API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxApiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Geocoding API error: ${errorText}` }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const data = await response.json();
    
    // Extract coordinates from the first result
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      
      return new Response(
        JSON.stringify({ 
          coordinates: { latitude, longitude },
          formatted_address: data.features[0].place_name,
          raw: data
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "No results found for this address" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
