
import { calculateDistance } from '@/lib/utils/distance';

/**
 * Get Mapbox public token from Supabase Edge Function
 */
export const getMapboxToken = async (): Promise<string> => {
  try {
    // Try to get from the Supabase Edge Function
    const response = await fetch('/api/get-mapbox-token');
    
    if (response.ok) {
      const { token } = await response.json();
      if (token) return token;
    }
    
    // Use a fallback token - NOTE: This should be replaced with a valid token
    // This is just a placeholder to ensure the component doesn't break
    return 'pk.eyJ1IjoiZGVtby1hY2NvdW50IiwiYSI6ImNscHdkZjBiODJ0NTMyaW1yOWdoN2FvdW8ifQ.r_qpHhn0rJd-SgGhNfRw1A';
  } catch (error) {
    console.error('Error getting Mapbox token:', error);
    // Return a fallback token
    return 'pk.eyJ1IjoiZGVtby1hY2NvdW50IiwiYSI6ImNscHdkZjBiODJ0NTMyaW1yOWdoN2FvdW8ifQ.r_qpHhn0rJd-SgGhNfRw1A';
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
    
    // Fetch coordinates from Mapbox API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Mapbox API error: ${response.status}`);
      return fallbackCoordinates || null;
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
