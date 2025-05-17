
import { calculateDistance } from '@/lib/utils/distance';

// Use a known working token as fallback
const FALLBACK_TOKEN = 'pk.eyJ1IjoiZGVtb2FjY291bnQyMDIwIiwiYSI6ImNrY3M1MHNxcDBrNXAycW1pcngzaGk5cDEifQ.sTh_v9zXhaUXuR2-tUMmVw';

/**
 * Get Mapbox public token from Supabase Edge Function or fallback to default
 */
export const getMapboxToken = async (): Promise<string> => {
  try {
    console.log('getMapboxToken: Starting token retrieval');
    
    // Check if we have a cached token
    const cachedToken = localStorage.getItem('mapbox_token');
    if (cachedToken) {
      console.log('getMapboxToken: Using cached Mapbox token');
      return cachedToken;
    }
    
    console.log('getMapboxToken: Fetching Mapbox token from Edge Function...');
    
    // Try to get from the Supabase Edge Function with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      const response = await fetch('/api/get-mapbox-token', {
        signal: controller.signal,
        // Add cache control to avoid CORS preflight issues
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`getMapboxToken: Failed to fetch Mapbox token: ${response.status}`);
        return useFallbackToken();
      }
      
      const data = await response.json();
      
      if (data && data.token) {
        console.log('getMapboxToken: Successfully retrieved Mapbox token');
        localStorage.setItem('mapbox_token', data.token);
        return data.token;
      }
    } catch (fetchError) {
      console.warn('getMapboxToken: Error fetching Mapbox token:', fetchError);
      return useFallbackToken();
    }
    
    return useFallbackToken();
  } catch (error) {
    console.error('getMapboxToken: Unexpected error getting Mapbox token:', error);
    return useFallbackToken();
  }
};

function useFallbackToken(): string {
  console.log('getMapboxToken: Using fallback Mapbox token');
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
    console.log('getCoordinatesWithMapbox: Searching for:', query);
    
    // Check cache first
    const cacheKey = `mapbox-coords-${query}`;
    const cachedCoords = sessionStorage.getItem(cacheKey);
    
    if (cachedCoords) {
      console.log('getCoordinatesWithMapbox: Using cached coordinates');
      return JSON.parse(cachedCoords);
    }
    
    // Get Mapbox token
    const token = await getMapboxToken();
    
    // Fetch coordinates from Mapbox API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`;
    console.log('getCoordinatesWithMapbox: Fetching from Mapbox API');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`getCoordinatesWithMapbox: Mapbox API error ${response.status}`);
      throw new Error(`Mapbox API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      // Mapbox returns coordinates as [lng, lat]
      const [lng, lat] = data.features[0].center;
      const coordinates = { lat, lng };
      
      console.log('getCoordinatesWithMapbox: Found coordinates:', coordinates);
      
      // Cache the result
      sessionStorage.setItem(cacheKey, JSON.stringify(coordinates));
      
      return coordinates;
    }
    
    console.log('getCoordinatesWithMapbox: No location found for query:', query);
    return fallbackCoordinates || null;
  } catch (error) {
    console.error('getCoordinatesWithMapbox: Error:', error);
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
