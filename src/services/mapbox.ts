
import { supabase } from '@/lib/supabase';
import { LocalCache } from '@/lib/cache';

const CACHE_KEY = 'mapbox-token';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function getMapboxToken(): Promise<string | null> {
  try {
    // First try to get from cache
    const cachedToken = LocalCache.get<string>(CACHE_KEY);
    if (cachedToken) {
      console.log('Using cached Mapbox token');
      return cachedToken;
    }

    // Try to get from localStorage
    const localToken = localStorage.getItem('mapbox_token');
    if (localToken) {
      console.log('Using Mapbox token from localStorage');
      LocalCache.set(CACHE_KEY, localToken, CACHE_DURATION);
      return localToken;
    }

    // Try to get from environment variable
    const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (envToken) {
      console.log('Using Mapbox token from environment variable');
      LocalCache.set(CACHE_KEY, envToken, CACHE_DURATION);
      return envToken;
    }

    // Finally, try to get from Supabase Edge Function
    console.log('Fetching Mapbox token from Supabase Edge Function...');
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    
    if (error) {
      console.error('Error calling get-mapbox-token function:', error);
      return null;
    }

    if (data?.token) {
      console.log('Successfully received token from Edge Function');
      LocalCache.set(CACHE_KEY, data.token, CACHE_DURATION);
      return data.token;
    }

    console.error('No token received from Edge Function');
    return null;
  } catch (error) {
    console.error('Error getting Mapbox token:', error);
    return null;
  }
}

export async function getCoordinatesWithMapbox(query: string): Promise<{lat: number, lng: number} | null> {
  const token = await getMapboxToken();
  if (!token) {
    console.error('No Mapbox token available for geocoding');
    return null;
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${token}&limit=1`
    );

    if (!response.ok) {
      console.error('Mapbox geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding with Mapbox:', error);
    return null;
  }
}

export function getDistanceFromUserToPharmacy(
  userLocation: { lat: number; lon: number },
  pharmacyLocation: { lat: number; lng: number }
): number | string {
  try {
    if (!userLocation?.lat || !userLocation?.lon || !pharmacyLocation?.lat || !pharmacyLocation?.lng) {
      return 'Location unavailable';
    }

    const R = 6371; // Radius of the Earth in km
    const dLat = (pharmacyLocation.lat - userLocation.lat) * Math.PI / 180;
    const dLon = (pharmacyLocation.lng - userLocation.lon) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(pharmacyLocation.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error('Error calculating distance:', error);
    return 'Distance calculation failed';
  }
}
