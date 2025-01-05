const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const CORS_PROXY = 'https://cors-proxy.lovable.workers.dev';

// Keep track of the current request
let currentRequest: AbortController | null = null;

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
  }, 15000); // 15 seconds timeout

  try {
    const params = new URLSearchParams({
      format: 'json',
      q: query,
      limit: '5',
      featuretype: 'city'
    });

    const nominatimUrl = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;
    
    const response = await fetch(`${CORS_PROXY}/?url=${encodeURIComponent(nominatimUrl)}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: currentRequest.signal,
      mode: 'cors',
      credentials: 'omit'
    });

    clearTimeout(timeoutId);
    currentRequest = null;

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
