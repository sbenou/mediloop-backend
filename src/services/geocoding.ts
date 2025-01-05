const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Keep track of the current request
let currentRequest: AbortController | null = null;
let currentTimeout: NodeJS.Timeout | null = null;

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
  console.log('Searching for city:', query);
  
  try {
    // Create new abort controller for this request
    currentRequest = new AbortController();
    
    const params = new URLSearchParams({
      format: 'json',
      q: query,
      limit: '5',
      featuretype: 'city'
    });

    const nominatimUrl = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;
    console.log('Sending request to:', nominatimUrl);
    
    const response = await fetch(nominatimUrl, {
      signal: currentRequest.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FindDoctorApp/1.0',
      },
      referrerPolicy: 'no-referrer'
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status, response.statusText);
      return {
        results: [],
        error: {
          type: 'network',
          message: 'Failed to fetch results from the server. Please try again.'
        }
      };
    }

    const data = await response.json();
    console.log('Received data:', data);

    if (!Array.isArray(data)) {
      console.error('Unexpected response format:', data);
      return {
        results: [],
        error: {
          type: 'network',
          message: 'Received invalid response format from the server.'
        }
      };
    }

    return { results: data };
  } catch (error: any) {
    console.error('Error in searchCity:', error);

    // Don't treat AbortError as an error that needs user notification
    if (error.name === 'AbortError') {
      return { results: [] };
    }

    return {
      results: [],
      error: {
        type: 'network',
        message: 'Failed to search for the city. Please check your internet connection and try again.'
      }
    };
  } finally {
    // Always clean up
    cleanupPendingRequests();
  }
};

export const getCoordinates = async (city: string): Promise<{ lat: string; lon: string } | null> => {
  console.log('Getting coordinates for city:', city);
  
  try {
    const { results, error } = await searchCity(city);
    
    if (error) {
      console.error('Error getting coordinates:', error);
      throw new Error(error.message);
    }
    
    if (results.length > 0 && results[0].lat && results[0].lon) {
      console.log('Found coordinates:', { lat: results[0].lat, lon: results[0].lon });
      return {
        lat: results[0].lat,
        lon: results[0].lon
      };
    }

    console.log('No coordinates found for city:', city);
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    throw error;
  }
};
