import { toast } from "@/components/ui/use-toast";

interface GeocodingResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

interface SearchResponse {
  results?: GeocodingResult[];
  error?: {
    message: string;
  };
}

export const searchCity = async (query: string): Promise<SearchResponse> => {
  console.info('Searching for city:', query);
  
  try {
    // Check cache first
    const cachedData = sessionStorage.getItem(`city-search-${query}`);
    if (cachedData) {
      console.info('Returning cached city search results');
      return JSON.parse(cachedData);
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&featuretype=city`;
    console.info('Sending request to:', nominatimUrl);

    const response = await fetch(nominatimUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FindDoctorApp/1.0',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Cache the successful response
    sessionStorage.setItem(`city-search-${query}`, JSON.stringify({ results: data }));
    return { results: data };
  } catch (error: any) {
    console.error('Error in searchCity:', error);
    // Try to get from cache on error
    const cachedData = sessionStorage.getItem(`city-search-${query}`);
    if (cachedData) {
      console.info('Returning cached data after error');
      return JSON.parse(cachedData);
    }
    return {
      error: {
        message: 'Failed to search for the city. Using cached data if available.'
      }
    };
  }
};

export const getCoordinates = async (city: string): Promise<{ lat: string; lon: string } | null> => {
  console.info('Getting coordinates for city:', city);
  
  try {
    const cachedData = sessionStorage.getItem(`coords-${city}`);
    if (cachedData) {
      console.info('Returning cached coordinates');
      return JSON.parse(cachedData);
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FindDoctorApp/1.0',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const coords = {
        lat: data[0].lat,
        lon: data[0].lon
      };
      
      // Cache the coordinates
      sessionStorage.setItem(`coords-${city}`, JSON.stringify(coords));
      return coords;
    }
    return null;
  } catch (error: any) {
    console.error('Error getting coordinates:', error);
    // Try to get from cache even if request fails
    const cachedData = sessionStorage.getItem(`coords-${city}`);
    if (cachedData) {
      console.info('Returning cached coordinates after error');
      return JSON.parse(cachedData);
    }
    return null;
  }
};