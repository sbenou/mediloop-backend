
interface AddressSuggestion {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  formatted: string;
}

export async function searchAddressesByQuery(query: string): Promise<AddressSuggestion[]> {
  try {
    // Using Mapbox geocoding API
    const mapboxApiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "YOUR_MAPBOX_API_KEY";
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxApiKey}&types=address&limit=5`;
    
    const response = await fetch(endpoint);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch address suggestions');
    }
    
    // Transform Mapbox response to our AddressSuggestion format
    return data.features.map((feature: any) => {
      const context = feature.context || [];
      const cityContext = context.find((c: any) => c.id.startsWith('place'));
      const postalContext = context.find((c: any) => c.id.startsWith('postcode'));
      const countryContext = context.find((c: any) => c.id.startsWith('country'));
      
      return {
        street: feature.text || '',
        city: cityContext ? cityContext.text : '',
        postal_code: postalContext ? postalContext.text : '',
        country: countryContext ? countryContext.text : '',
        formatted: feature.place_name || '',
      };
    });
  } catch (error) {
    console.error('Error searching for addresses:', error);
    return [];
  }
}
