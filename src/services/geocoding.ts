
import { LocalCache } from '@/lib/cache';
import { getMapboxToken } from './mapbox';

// Default coordinates for common locations
const DEFAULT_COORDINATES: Record<string, { lat: string; lon: string }> = {
  'luxembourg': { lat: '49.8153', lon: '6.1296' },
  'luxembourg city': { lat: '49.6116', lon: '6.1319' },
  'esch-sur-alzette': { lat: '49.4941', lon: '5.9806' },
  'differdange': { lat: '49.5242', lon: '5.8903' },
  'dudelange': { lat: '49.4783', lon: '6.0844' },
};

export async function getCoordinates(query: string): Promise<{ lat: string; lon: string } | null> {
  if (!query) return null;
  
  // Check cache first
  const normalizedQuery = query.toLowerCase().trim();
  const cacheKey = `geocoding-${normalizedQuery}`;
  const cachedCoords = LocalCache.get<{ lat: string; lon: string }>(cacheKey);
  
  if (cachedCoords) {
    console.log('Using cached coordinates for:', normalizedQuery);
    return cachedCoords;
  }
  
  // Check if we have default coordinates for this location
  for (const [key, coords] of Object.entries(DEFAULT_COORDINATES)) {
    if (normalizedQuery.includes(key)) {
      console.log(`Using default coordinates for location: ${key}`);
      LocalCache.set(cacheKey, coords);
      return coords;
    }
  }
  
  try {
    const mapboxToken = await getMapboxToken();
    console.log('Got mapbox token, fetching coordinates for:', normalizedQuery);
    
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedQuery)}.json?access_token=${mapboxToken}&limit=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Mapbox API error: ${response.status}`);
      
      // Return Luxembourg as default
      const result = DEFAULT_COORDINATES.luxembourg;
      LocalCache.set(cacheKey, result);
      return result;
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      const result = { lat: String(lat), lon: String(lng) };
      
      // Cache the results for future use
      LocalCache.set(cacheKey, result);
      
      return result;
    }
    
    // If no results but query has a location keyword, use default coordinates
    for (const [key, coords] of Object.entries(DEFAULT_COORDINATES)) {
      if (normalizedQuery.includes(key)) {
        console.log(`Using default coordinates for location keyword: ${key}`);
        LocalCache.set(cacheKey, coords);
        return coords;
      }
    }
    
    // Default to Luxembourg if all else fails
    return DEFAULT_COORDINATES.luxembourg;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    
    // Default to Luxembourg if all else fails
    return DEFAULT_COORDINATES.luxembourg;
  }
}

// Add the missing searchCity function
export async function searchCity(query: string): Promise<Array<{ display_name: string; place_id: number }>> {
  if (!query || query.length < 2) return [];
  
  try {
    const mapboxToken = await getMapboxToken();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=place&limit=5`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Mapbox city search API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      // Map Mapbox responses to match the expected interface
      return data.features.map((feature: any, index: number) => ({
        display_name: feature.place_name,
        place_id: index // Use index as place_id since Mapbox doesn't have a direct equivalent
      }));
    }
    return [];
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
}

// Ensure we have a comprehensive function for address search that's used consistently
export async function searchAddress(query: string): Promise<Array<{
  street: string;
  city: string;
  postal_code: string;
  country: string;
  formatted: string;
}>> {
  if (!query || query.length < 3) return [];
  
  try {
    const mapboxToken = await getMapboxToken();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=address&limit=5`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Mapbox address search API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features.map((feature: any) => {
        // Parse address components from the Mapbox result
        const addressParts = feature.place_name.split(',').map((part: string) => part.trim());
        
        // Find postal code (usually in the format "12345")
        const postalCodeMatch = feature.place_name.match(/\b\d{4,5}\b/);
        const postalCode = postalCodeMatch ? postalCodeMatch[0] : '';
        
        // Extract the first part as street, and try to identify city, country from context
        const street = addressParts[0];
        
        // Get city, country from context if available
        let city = '', country = '';
        if (feature.context) {
          feature.context.forEach((ctx: any) => {
            if (ctx.id.startsWith('place')) {
              city = ctx.text;
            } else if (ctx.id.startsWith('country')) {
              country = ctx.text;
            }
          });
        }
        
        // If we couldn't extract city from context, try to get it from address parts
        if (!city && addressParts.length > 1) {
          city = addressParts[1];
        }
        
        // If we couldn't extract country from context, use the last part
        if (!country && addressParts.length > 2) {
          country = addressParts[addressParts.length - 1];
        }
        
        return {
          street: street,
          city: city,
          postal_code: postalCode,
          country: country,
          formatted: feature.place_name
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error searching addresses:', error);
    return [];
  }
}
