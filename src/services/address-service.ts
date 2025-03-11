
// This service uses Mapbox Geocoding API for fetching address information
// It provides better search functionality and more reliable results
import { supabase } from '@/lib/supabase';

interface AddressResult {
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    formatted?: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface AddressSuggestion {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  formatted: string;
}

// Get the Mapbox access token from Edge function for security
export const getMapboxToken = async (): Promise<string> => {
  try {
    // Try to get the token from a Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    
    if (error || !data?.token) {
      console.warn('Could not get Mapbox token from Edge Function, using fallback token');
      // Fallback to the test token if the Edge Function fails
      return 'pk.eyJ1IjoibG92YWJsZS10ZXN0IiwiYSI6ImNscmN0ZG96ZjBjemsyaXQ0Nm8zcnhkY2MifQ.IYYu7fJKa45S4TXxTV6-KA';
    }
    
    return data.token;
  } catch (e) {
    console.error('Error getting Mapbox token:', e);
    // Fallback to the test token if there's an error
    return 'pk.eyJ1IjoibG92YWJsZS10ZXN0IiwiYSI6ImNscmN0ZG96ZjBjemsyaXQ0Nm8zcnhkY2MifQ.IYYu7fJKa45S4TXxTV6-KA';
  }
};

// Sample fallback data in case the Mapbox API doesn't return results
// (useful for testing with restricted tokens)
const SAMPLE_ADDRESS_SUGGESTIONS: AddressSuggestion[] = [
  {
    street: '123 Main Street',
    city: 'Luxembourg City',
    postal_code: '1234',
    country: 'Luxembourg',
    formatted: '123 Main Street, Luxembourg City, 1234, Luxembourg'
  },
  {
    street: '45 Avenue de la Liberté',
    city: 'Luxembourg City',
    postal_code: '1930',
    country: 'Luxembourg',
    formatted: '45 Avenue de la Liberté, Luxembourg City, 1930, Luxembourg'
  },
  {
    street: '10 Boulevard Royal',
    city: 'Luxembourg City',
    postal_code: '2449',
    country: 'Luxembourg',
    formatted: '10 Boulevard Royal, Luxembourg City, 2449, Luxembourg'
  },
  {
    street: '25 Rue Notre Dame',
    city: 'Luxembourg City',
    postal_code: '2240',
    country: 'Luxembourg',
    formatted: '25 Rue Notre Dame, Luxembourg City, 2240, Luxembourg'
  },
  {
    street: '5 Place d\'Armes',
    city: 'Luxembourg City',
    postal_code: '1136',
    country: 'Luxembourg',
    formatted: '5 Place d\'Armes, Luxembourg City, 1136, Luxembourg'
  }
];

export async function fetchAddressFromPostcode(postcode: string): Promise<AddressResult> {
  try {
    if (!postcode || postcode.length < 3) {
      console.log('Postcode too short, not searching');
      return {};
    }

    console.log('Fetching address from postcode with Mapbox API:', postcode);
    
    const mapboxToken = await getMapboxToken();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postcode)}.json?access_token=${mapboxToken}&types=postcode&limit=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Mapbox address API response:', data);
    
    if (data.features && data.features.length > 0) {
      const result = data.features[0];
      
      // Extract place data
      const context = result.context || [];
      let city = '', state = '', country = '';
      
      // Extract address components from context
      context.forEach((ctx: any) => {
        if (ctx.id.startsWith('place')) {
          city = ctx.text;
        } else if (ctx.id.startsWith('region')) {
          state = ctx.text;
        } else if (ctx.id.startsWith('country')) {
          country = ctx.text;
        }
      });
      
      // Extract street name if available
      const addressParts = result.place_name.split(',');
      const street = addressParts.length > 1 ? addressParts[0].trim() : '';
      
      return {
        address: {
          street: street,
          city: city,
          state: state,
          country: country,
          formatted: result.place_name
        },
        coordinates: {
          lat: result.center[1],
          lng: result.center[0]
        }
      };
    }
    
    return {};
  } catch (error) {
    console.error('Error fetching address from Mapbox:', error);
    return {};
  }
}

export async function searchAddressesByQuery(query: string): Promise<AddressSuggestion[]> {
  try {
    // Only search when we have a meaningful query
    if (!query || query.length < 3) {
      console.log('Query too short, not searching');
      return [];
    }

    console.log('Starting Mapbox search for:', query);
    
    const mapboxToken = await getMapboxToken();
    // Configure the search to be more flexible and use multiple types
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=address,place,poi,postcode&autocomplete=true&limit=5&language=en`;
    
    console.log('Searching addresses with Mapbox API query:', query);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Mapbox address search API response:', data);
    
    if (data.features && data.features.length > 0) {
      // Map the Mapbox results to our AddressSuggestion format
      return data.features.map((feature: any) => {
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
    
    // If Mapbox API returns no results or we're using a test token with limited access,
    // return sample fallback data that matches our query (case insensitive)
    console.log('No address results found from Mapbox, using fallback data');
    const normalizedQuery = query.toLowerCase();
    return SAMPLE_ADDRESS_SUGGESTIONS.filter(address => 
      address.street.toLowerCase().includes(normalizedQuery) ||
      address.city.toLowerCase().includes(normalizedQuery) ||
      address.postal_code.includes(normalizedQuery) ||
      address.country.toLowerCase().includes(normalizedQuery)
    );
  } catch (error) {
    console.error('Error searching addresses with Mapbox:', error);
    
    // Return fallback sample data in case of an error
    console.log('Using fallback address suggestions due to error');
    const normalizedQuery = query.toLowerCase();
    return SAMPLE_ADDRESS_SUGGESTIONS.filter(address => 
      address.street.toLowerCase().includes(normalizedQuery) ||
      address.city.toLowerCase().includes(normalizedQuery) ||
      address.postal_code.includes(normalizedQuery) ||
      address.country.toLowerCase().includes(normalizedQuery)
    );
  }
}
