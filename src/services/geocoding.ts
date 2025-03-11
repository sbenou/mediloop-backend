
import { getMapboxToken } from './address-service';

export async function getCoordinates(query: string): Promise<{ lat: string; lon: string } | null> {
  if (!query) return null;
  
  try {
    const mapboxToken = await getMapboxToken();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      // Cache the results
      sessionStorage.setItem(`coords-${query}`, JSON.stringify({ lat: String(lat), lon: String(lng) }));
      return { lat: String(lat), lon: String(lng) };
    }
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
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
      throw new Error(`Mapbox API error: ${response.status}`);
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
    // Reuse the existing searchAddressesByQuery function from address-service.ts
    const mapboxToken = await getMapboxToken();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=address&limit=5`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features.map((feature: any) => {
        // Parse the address components from the Mapbox result
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
