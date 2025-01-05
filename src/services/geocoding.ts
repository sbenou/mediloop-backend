const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

interface GeocodingResult {
  display_name: string;
  place_id: number;
  lat: string;
  lon: string;
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
    const params = new URLSearchParams({
      format: 'json',
      q: query,
      limit: '5',
      featuretype: 'city'
    });

    const nominatimUrl = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;
    console.log('Sending request to:', nominatimUrl);
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FindDoctorApp/1.0'
      },
      referrerPolicy: 'no-referrer'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
    
    // Don't treat AbortError as a user-facing error since it's expected
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