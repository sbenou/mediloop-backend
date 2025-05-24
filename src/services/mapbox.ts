
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
