
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
    
    // Try to get token from Supabase edge function
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-mapbox-token`, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          console.log('Fetched Mapbox token');
          cachedToken = data.token;
          return data.token;
        } else {
          throw new Error('Invalid token format received');
        }
      } else {
        throw new Error(`Supabase function returned ${response.status}`);
      }
    } catch (error) {
      console.error('getMapboxToken: Error fetching Mapbox token:', error);
      throw error; // Let the fallback handle it
    }
  } catch (error) {
    console.log('getMapboxToken: Using fallback Mapbox token');
    
    // Use a fallback token - rotate through available tokens if one fails
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

