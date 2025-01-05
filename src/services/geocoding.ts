const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const CORS_PROXY = 'https://cors-proxy.lovable.workers.dev';

// Keep track of the current request
let currentRequest: AbortController | null = null;
let currentTimeout: NodeJS.Timeout | null = null;

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

// Cleanup function to abort any pending requests
const cleanupPendingRequests = () => {
  if (currentRequest) {
    currentRequest.abort();
    currentRequest = null;
  }
  if (currentTimeout) {
    clearTimeout(currentTimeout);
    currentTimeout = null;
  }
};

export const searchCity = async (query: string): Promise<GeocodingResponse> => {
  // Clean up any pending requests first
  cleanupPendingRequests();

  // Create new abort controller for this request
  currentRequest = new AbortController();
  
  // Set timeout
  currentTimeout = setTimeout(() => {
    cleanupPendingRequests();
  }, 15000); // 15 seconds timeout

  try {
    const params = new URLSearchParams({
      format: 'json',
      q: query,
      limit: '5',
      featuretype: 'city'
    });

    const nominatimUrl = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;
    const proxyUrl = `${CORS_PROXY}/?url=${encodeURIComponent(nominatimUrl)}`;
    
    const response = await fetch(proxyUrl, {
      signal: currentRequest.signal,
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    });

    // Clean up after successful request
    cleanupPendingRequests();

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { results: data };
  } catch (error: any) {
    // Clean up on error
    cleanupPendingRequests();

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