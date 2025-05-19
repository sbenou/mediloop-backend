
import { calculateDistance } from '@/lib/utils/distance';
import { LocalCache } from '@/lib/cache';

// This is a more recent Mapbox public token that can be used for development
const MAPBOX_PUBLIC_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

/**
 * Get Mapbox public token with improved error handling
 */
export const getMapboxToken = async (): Promise<string> => {
  // Check cache first
  const cachedToken = LocalCache.get<string>('mapbox-token');
  if (cachedToken) {
    console.log('Using cached Mapbox token');
    return cachedToken;
  }

  try {
    // Try to get from Supabase function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-mapbox-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data?.token) {
        console.log('Retrieved Mapbox token from API');
        // Cache the token for future use
        LocalCache.set('mapbox-token', data.token);
        return data.token;
      }
    }
    
    console.warn('Could not fetch token from API, using default public token');
    // Cache and return the public token as fallback
    LocalCache.set('mapbox-token', MAPBOX_PUBLIC_TOKEN);
    return MAPBOX_PUBLIC_TOKEN;
  } catch (error) {
    console.error('getMapboxToken: Error fetching Mapbox token:', error);
    
    // Cache and return the public token as fallback
    LocalCache.set('mapbox-token', MAPBOX_PUBLIC_TOKEN);
    return MAPBOX_PUBLIC_TOKEN;
  }
};

/**
 * Get coordinates of a location using cached data and fallbacks
 * This version doesn't actually call the Mapbox API
 */
export const getCoordinatesWithMapbox = async (
  query: string, 
  fallbackCoordinates?: { lat: number; lng: number }
): Promise<{ lat: number; lng: number } | null> => {
  if (!query) return fallbackCoordinates || null;
  
  try {
    console.log('getCoordinatesWithMapbox: Looking up:', query);
    
    // Check cache first - use normalized query for better cache hits
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
    const cacheKey = `mapbox-coords-${normalizedQuery}`;
    const cachedCoords = LocalCache.get<{lat: number; lng: number}>(cacheKey);
    
    if (cachedCoords) {
      console.log('getCoordinatesWithMapbox: Using cached coordinates');
      return cachedCoords;
    }

    // Default coordinates for common locations
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
