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

// Keep track of the current request
let currentRequest: AbortController | null = null;

export const searchCity = async (query: string): Promise<GeocodingResponse> => {
  // Cancel any pending request
  if (currentRequest) {
    currentRequest.abort();
  }

  // Create new abort controller for this request
  currentRequest = new AbortController();
  const timeoutId = setTimeout(() => {
    if (currentRequest) {
      currentRequest.abort();
    }
  }, 15000); // Increased timeout to 15 seconds

  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5&featuretype=city`,
      {
        headers: {
          'User-Agent': 'MediHop Health App (development)',
          'Accept-Language': 'en'
        },
        signal: currentRequest.signal
      }
    );

    clearTimeout(timeoutId);
    currentRequest = null;

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
    currentRequest = null;

    if (error.name === 'AbortError') {
      return {
        results: [],
        error: {
          type: 'timeout',
          message: 'The search request timed out. Please try again.'
        }
      };
    }

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
