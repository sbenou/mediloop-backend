
import { supabase } from "@/lib/supabase";

interface AddressResult {
  address?: {
    street: string;
    city: string;
    country: string;
    postal_code?: string;
  };
  error?: string;
}

interface AddressSuggestion {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  formatted: string;
}

export async function fetchAddressFromPostcode(postcode: string): Promise<AddressResult> {
  try {
    // Call the Supabase Edge Function that communicates with the Mapbox API
    const { data, error } = await supabase.functions.invoke('get-geocoding', {
      body: { query: postcode, types: 'postcode' }
    });

    if (error) throw error;

    if (data && data.features && data.features.length > 0) {
      const feature = data.features[0];
      const { place_name, context } = feature;
      
      // Extract the address components from the Mapbox response
      const city = context?.find((c: any) => c.id.startsWith('place'))?.text || '';
      const country = context?.find((c: any) => c.id.startsWith('country'))?.text || '';
      
      return {
        address: {
          street: place_name || '',
          city,
          country,
          postal_code: postcode
        }
      };
    }
    
    return { error: 'No address found for this postcode' };
  } catch (error) {
    console.error('Error fetching address from postcode:', error);
    return { error: 'Failed to fetch address' };
  }
}

export async function searchAddressesByQuery(query: string): Promise<AddressSuggestion[]> {
  try {
    const { data, error } = await supabase.functions.invoke('get-geocoding', {
      body: { query }
    });

    if (error) throw error;

    if (data && data.features && data.features.length > 0) {
      return data.features.map((feature: any) => {
        const { place_name, context, text } = feature;
        
        // Extract address components
        const city = context?.find((c: any) => c.id.startsWith('place'))?.text || '';
        const region = context?.find((c: any) => c.id.startsWith('region'))?.text || '';
        const country = context?.find((c: any) => c.id.startsWith('country'))?.text || '';
        const postalCode = context?.find((c: any) => c.id.startsWith('postcode'))?.text || '';
        
        return {
          street: text || '',
          city: city || region,
          postal_code: postalCode,
          country,
          formatted: place_name
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error searching addresses:', error);
    return [];
  }
}
