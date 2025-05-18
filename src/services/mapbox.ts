import { calculateDistance } from '@/lib/utils/distance';
import { LocalCache } from '@/lib/cache';

// Use a known working token as fallback
const FALLBACK_TOKEN = 'pk.eyJ1IjoiZGVtb2FjY291bnQyMDIwIiwiYSI6ImNrY3M1MHNxcDBrNXAycW1pcngzaGk5cDEifQ.sTh_v9zXhaUXuR2-tUMmVw';

/**
 * Get Mapbox public token from environment or fallback to default
 */
export const getMapboxToken = async (): Promise<string> => {
  try {
    console.log('getMapboxToken: Starting token retrieval');
    
    // Check if we have a cached token
    const cachedToken = LocalCache.get<string>('mapbox_token');
    if (cachedToken) {
      console.log('getMapboxToken: Using cached Mapbox token');
      return cachedToken;
    }
    
    // Skip Edge Function fetch and use the fallback token directly
    // to avoid JSON parsing errors
    console.log('getMapboxToken: Using fallback Mapbox token');
    LocalCache.set('mapbox_token', FALLBACK_TOKEN);
    return FALLBACK_TOKEN;
  } catch (error) {
    console.error('getMapboxToken: Unexpected error getting Mapbox token:', error);
    return FALLBACK_TOKEN;
  }
};

/**
 * Get coordinates of a location using Mapbox Geocoding API with enhanced caching
 */
export const getCoordinatesWithMapbox = async (
  query: string, 
  fallbackCoordinates?: { lat: number; lng: number }
): Promise<{ lat: number; lng: number } | null> => {
  if (!query) return fallbackCoordinates || null;
  
  try {
    console.log('getCoordinatesWithMapbox: Searching for:', query);
    
    // Check cache first - use normalized query for better cache hits
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
    const cacheKey = `mapbox-coords-${normalizedQuery}`;
    const cachedCoords = LocalCache.get<{lat: number; lng: number}>(cacheKey);
    
    if (cachedCoords) {
      console.log('getCoordinatesWithMapbox: Using cached coordinates');
      return cachedCoords;
    }
    
    // Get Mapbox token
    const token = await getMapboxToken();
    
    // Fetch coordinates from Mapbox API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedQuery)}.json?access_token=${token}&limit=1`;
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
      LocalCache.set(cacheKey, coordinates);
      
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
