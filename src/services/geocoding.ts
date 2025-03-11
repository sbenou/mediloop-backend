
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
