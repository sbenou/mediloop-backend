
import { getMapboxToken } from './address-service';

export async function getCoordinates(query: string): Promise<{ lat: string; lon: string } | null> {
  if (!query) return null;
  
  try {
    const mapboxToken = await getMapboxToken();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      // Cache the results
      sessionStorage.setItem(`coords-${query}`, JSON.stringify({ lat: String(lat), lon: String(lng) }));
      return { lat: String(lat), lon: String(lng) };
    }
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
}

// Add the missing searchCity function
export async function searchCity(query: string): Promise<Array<{ display_name: string; place_id: number }>> {
  if (!query || query.length < 2) return [];
  
  try {
    const mapboxToken = await getMapboxToken();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=place&limit=5`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      // Map Mapbox responses to match the expected interface
      return data.features.map((feature: any, index: number) => ({
        display_name: feature.place_name,
        place_id: index // Use index as place_id since Mapbox doesn't have a direct equivalent
      }));
    }
    return [];
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
}
