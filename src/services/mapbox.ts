
import { calculateDistance } from '@/lib/utils/distance';

// Use a known working token as fallback
const FALLBACK_TOKEN = 'pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA';

/**
 * Get Mapbox public token from Supabase Edge Function or fallback to default
 */
export const getMapboxToken = async (): Promise<string> => {
  try {
    // Check if we have a cached token
    const cachedToken = localStorage.getItem('mapbox_token');
    if (cachedToken) {
      console.log('Using cached Mapbox token');
      return cachedToken;
    }
    
    console.log('Fetching Mapbox token from Edge Function...');
    
    // Try to get from the Supabase Edge Function with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      const response = await fetch('/api/get-mapbox-token', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`Failed to fetch Mapbox token: ${response.status}`);
        return useFallbackToken();
      }
      
      const data = await response.json();
      
      if (data && data.token) {
        console.log('Successfully retrieved Mapbox token');
        localStorage.setItem('mapbox_token', data.token);
        return data.token;
      }
    } catch (fetchError) {
      console.warn('Error fetching Mapbox token:', fetchError);
      return useFallbackToken();
    }
    
    return useFallbackToken();
  } catch (error) {
    console.error('Unexpected error getting Mapbox token:', error);
    return useFallbackToken();
  }
};

function useFallbackToken(): string {
  console.log('Using fallback Mapbox token');
  localStorage.setItem('mapbox_token', FALLBACK_TOKEN);
  return FALLBACK_TOKEN;
}

/**
 * Get coordinates of a location using Mapbox Geocoding API
 */
export const getCoordinatesWithMapbox = async (
  query: string, 
  fallbackCoordinates?: { lat: number; lng: number }
): Promise<{ lat: number; lng: number } | null> => {
  if (!query) return fallbackCoordinates || null;
  
  try {
    // Check cache first
    const cacheKey = `mapbox-coords-${query}`;
    const cachedCoords = sessionStorage.getItem(cacheKey);
    
    if (cachedCoords) {
      return JSON.parse(cachedCoords);
    }
    
    // Get Mapbox token
    const token = await getMapboxToken();
    
    // Fetch coordinates from Mapbox API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      // Mapbox returns coordinates as [lng, lat]
      const [lng, lat] = data.features[0].center;
      const coordinates = { lat, lng };
      
      // Cache the result
      sessionStorage.setItem(cacheKey, JSON.stringify(coordinates));
      
      return coordinates;
    }
    
    console.log('No location found for query:', query);
    return fallbackCoordinates || null;
  } catch (error) {
    console.error('Error getting coordinates with Mapbox:', error);
    return fallbackCoordinates || null;
  }
};

/**
 * Calculate distance between user and pharmacy
 */
export const getDistanceFromUserToPharmacy = (
  userLocation: { lat: number; lon: number } | null,
  pharmacyCoordinates: { lat: number; lng: number } | null
): string | null => {
  if (!userLocation || !pharmacyCoordinates) return null;
  
  return calculateDistance(
    userLocation.lat,
    userLocation.lon,
    pharmacyCoordinates.lat,
    pharmacyCoordinates.lng
  );
};
