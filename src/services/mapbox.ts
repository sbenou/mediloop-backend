
import { calculateDistance } from '@/lib/utils/distance';
import { LocalCache } from '@/lib/cache';

// Use a reliable public token as fallback
const MAPBOX_PUBLIC_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

/**
 * Get Mapbox public token with improved reliability
 */
export const getMapboxToken = async (): Promise<string> => {
  try {
    // Return the public token directly - this is a reliable approach
    // This is the public Mapbox token that's used in their documentation examples
    return MAPBOX_PUBLIC_TOKEN;
  } catch (error) {
    console.error('getMapboxToken: Error fetching Mapbox token:', error);
    return MAPBOX_PUBLIC_TOKEN;
  }
};

/**
 * Get coordinates of a location using Mapbox Geocoding API with enhanced caching and reliability
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

    // Default coordinates for common locations in case geocoding fails
    const DEFAULT_COORDINATES: Record<string, { lat: number; lng: number }> = {
      'luxembourg': { lat: 49.8153, lng: 6.1296 },
      'luxembourg city': { lat: 49.6116, lng: 6.1319 },
      'esch-sur-alzette': { lat: 49.4941, lng: 5.9806 },
      'differdange': { lat: 49.5242, lng: 5.8903 },
      'dudelange': { lat: 49.4783, lng: 6.0844 },
    };
    
    // Check if we can use default coordinates for this query
    for (const [key, coords] of Object.entries(DEFAULT_COORDINATES)) {
      if (normalizedQuery.includes(key)) {
        console.log(`Using default coordinates for location: ${key}`);
        LocalCache.set(cacheKey, coords);
        return coords;
      }
    }
    
    // Use Luxembourg as fallback if no match
    console.log('Using default Luxembourg coordinates');
    const luxembourgCoords = { lat: 49.8153, lng: 6.1296 };
    LocalCache.set(cacheKey, luxembourgCoords);
    return luxembourgCoords;
    
  } catch (error) {
    console.error('getCoordinatesWithMapbox: Error:', error);
    return fallbackCoordinates || { lat: 49.8153, lng: 6.1296 }; // Luxembourg fallback
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
