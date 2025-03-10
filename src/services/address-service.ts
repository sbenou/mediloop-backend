
// This service uses the free API from opencagedata.com
// It fetches address information based on a postal code or address string

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

export async function fetchAddressFromPostcode(postcode: string): Promise<AddressResult> {
  try {
    // Using OpenCage Geocoding API (free tier allows 2,500 requests per day)
    // Replace with your own API key in a production environment
    const apiKey = 'c7f247fbb26b43ecb2ee4dd8a3599c29'; // Free demo API key with limited usage
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(postcode)}&key=${apiKey}&limit=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const components = result.components;
      
      return {
        address: {
          street: components.road || components.street || '',
          city: components.city || components.town || components.village || '',
          state: components.state || components.county || '',
          country: components.country || '',
          formatted: result.formatted || ''
        },
        coordinates: {
          lat: result.geometry.lat,
          lng: result.geometry.lng
        }
      };
    }
    
    return {};
  } catch (error) {
    console.error('Error fetching address:', error);
    return {};
  }
}

export async function searchAddressesByQuery(query: string): Promise<AddressSuggestion[]> {
  try {
    // Using OpenCage Geocoding API (free tier allows 2,500 requests per day)
    const apiKey = 'c7f247fbb26b43ecb2ee4dd8a3599c29'; // Free demo API key with limited usage
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=5`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results.map((result: any) => {
        const components = result.components;
        return {
          street: [
            components.house_number, 
            components.road || components.street
          ].filter(Boolean).join(' '),
          city: components.city || components.town || components.village || '',
          postal_code: components.postcode || '',
          country: components.country || '',
          formatted: result.formatted
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error searching addresses:', error);
    return [];
  }
}
