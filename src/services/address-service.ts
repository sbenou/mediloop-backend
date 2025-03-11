
interface AddressSuggestion {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  formatted: string;
}

import { supabase } from '@/lib/supabase';

export async function searchAddressesByQuery(query: string): Promise<AddressSuggestion[]> {
  try {
    // Using Mapbox geocoding API
    const mapboxApiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
    
    if (!mapboxApiKey) {
      console.error('Mapbox API key is not configured');
      return [];
    }
    
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxApiKey}&types=address&limit=5`;
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
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

export async function getCoordinatesFromAddress(address: string): Promise<{latitude: number, longitude: number} | null> {
  try {
    // Call our Supabase Edge Function for geocoding
    const { data, error } = await fetch('/api/get-geocoding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    }).then(res => res.json());

    if (error) {
      console.error('Geocoding error:', error);
      return null;
    }

    return data.coordinates;
  } catch (error) {
    console.error('Failed to geocode address:', error);
    return null;
  }
}

// Add a new function to soft-delete pharmacy team members
export async function softDeleteTeamMember(memberId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('soft_delete_team_member', { member_id: memberId });
    
    if (error) {
      console.error('Error soft deleting team member:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to soft delete team member:', error);
    return false;
  }
}
