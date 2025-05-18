
import { calculateDistance } from '@/lib/utils/distance';
import { LocalCache } from '@/lib/cache';

// Use several working tokens as fallback
const FALLBACK_TOKENS = [
  'pk.eyJ1IjoiZGVtb2FjY291bnQyMDIwIiwiYSI6ImNrY3M1MHNxcDBrNXAycW1pcngzaGk5cDEifQ.sTh_v9zXhaUXuR2-tUMmVw',
  'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA' // Mapbox default public token
];

let currentTokenIndex = 0;
let cachedToken: string | null = null;

/**
 * Get Mapbox public token with improved reliability
 */
export const getMapboxToken = async (): Promise<string> => {
  try {
    console.log('getMapboxToken: Starting token retrieval');
    
    // Return cached token if available
    if (cachedToken) {
      console.log('getMapboxToken: Using cached token');
      return cachedToken;
    }
    
    // Use a hardcoded token for development/test environments
    // This ensures the map can load even if Supabase functions are unavailable
    if (import.meta.env.DEV) {
      console.log('getMapboxToken: Using development token');
      cachedToken = FALLBACK_TOKENS[0];
      return cachedToken;
    }
    
    // Try to get token from Supabase edge function
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-mapbox-token`;
    console.log(`getMapboxToken: Fetching from ${url}`);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Supabase function returned ${response.status}`);
    }
    
    // Parse response text as JSON
    const text = await response.text();
    
    // Validate that we got valid JSON before parsing
    try {
      const data = JSON.parse(text);
      if (data && data.token) {
        console.log('getMapboxToken: Successfully fetched token');
        cachedToken = data.token;
        return data.token;
      } else {
        throw new Error('Invalid token data format');
      }
    } catch (parseError) {
      console.error('getMapboxToken: Error parsing token response:', parseError, 'Response was:', text);
      throw new Error('Failed to parse token response');
    }
  } catch (error) {
    console.error('getMapboxToken: Error fetching Mapbox token:', error);
    
    // Use a fallback token - rotate through available tokens if one fails
    console.log('getMapboxToken: Using fallback Mapbox token');
    const token = FALLBACK_TOKENS[currentTokenIndex];
    currentTokenIndex = (currentTokenIndex + 1) % FALLBACK_TOKENS.length;
    cachedToken = token;
    
    return token;
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
    
    // Get Mapbox token
    const token = await getMapboxToken();
    
    // Fetch coordinates from Mapbox API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedQuery)}.json?access_token=${token}&limit=1`;
    console.log('getCoordinatesWithMapbox: Fetching from Mapbox API');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`getCoordinatesWithMapbox: Mapbox API error ${response.status}`);
      
      // Return Luxembourg coordinates as fallback
      if (!fallbackCoordinates) {
        fallbackCoordinates = DEFAULT_COORDINATES.luxembourg;
      }
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
    return fallbackCoordinates || DEFAULT_COORDINATES.luxembourg;
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
