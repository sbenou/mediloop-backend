const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

interface GeocodingResult {
  display_name: string;
  place_id: number;
  lat?: string;
  lon?: string;
}

interface GeocodingResponse {
  results: GeocodingResult[];
  error?: {
    type: 'timeout' | 'network' | 'not_found';
    message: string;
  };
}

export const searchCity = async (query: string): Promise<GeocodingResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5&featuretype=city`,
      {
        headers: {
          'User-Agent': 'MediHop Health App (development)',
          'Accept-Language': 'en'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        results: [],
        error: {
          type: 'network',
          message: 'Network error occurred while searching for the city.'
        }
      };
    }

    const data = await response.json();
    return { results: data };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('Request timed out:', error);
      return {
        results: [],
        error: {
          type: 'timeout',
          message: 'The search request timed out. Please try again.'
        }
      };
    }
    console.error('Geocoding error:', error);
    return {
      results: [],
      error: {
        type: 'network',
        message: 'Failed to search for the city. Please try again.'
      }
    };
  }
};

export const getCoordinates = async (city: string): Promise<{ lat: string; lon: string } | null> => {
  try {
    const { results, error } = await searchCity(city);
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (results.length > 0 && results[0].lat && results[0].lon) {
      return {
        lat: results[0].lat,
        lon: results[0].lon
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    throw error;
  }
};