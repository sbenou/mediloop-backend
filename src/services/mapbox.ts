
import { calculateDistance } from '@/lib/utils/distance';

// Fallback token - use this only if the Edge Function fails
const FALLBACK_TOKEN = 'pk.eyJ1IjoiZGVtby1hY2NvdW50IiwiYSI6ImNscHdkZjBiODJ0NTMyaW1yOWdoN2FvdW8ifQ.r_qpHhn0rJd-SgGhNfRw1A';

/**
 * Get Mapbox public token from Supabase Edge Function
 */
export const getMapboxToken = async (): Promise<string> => {
  try {
    // Try to get from the Supabase Edge Function
    const response = await fetch('/api/get-mapbox-token');
    
    if (!response.ok) {
      console.error(`Failed to fetch Mapbox token: ${response.status}`);
      return FALLBACK_TOKEN;
    }
    
    // Validate the response is proper JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid response content type:', contentType);
      return FALLBACK_TOKEN;
    }
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing Mapbox token response:', parseError);
      console.error('Response text:', text);
      return FALLBACK_TOKEN;
    }
    
    if (data && data.token) {
      return data.token;
    }
    
    console.error('Invalid token response format');
    return FALLBACK_TOKEN;
  } catch (error) {
    console.error('Error getting Mapbox token:', error);
    return FALLBACK_TOKEN;
  }
};

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
    
    if (!token) {
      console.error('No valid Mapbox token available');
      return fallbackCoordinates || null;
    }
    
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
