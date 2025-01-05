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

interface OverpassResponse {
  elements: Array<{
    id: number;
    lat: number;
    lon: number;
    tags: {
      name?: string;
      'addr:city'?: string;
      place?: string;
    };
  }>;
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

    const overpassQuery = `
      [out:json][timeout:25];
      area[name="${query}"][admin_level~"8|6|4"];
      out center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OverpassResponse = await response.json();
    
    // Transform Overpass results to match expected format
    const results = data.elements.map((element, index) => ({
      place_id: element.id || index,
      lat: element.lat.toString(),
      lon: element.lon.toString(),
      display_name: element.tags.name || query
    }));

    // Cache the successful response
    const responseData = { results };
    sessionStorage.setItem(`city-search-${query}`, JSON.stringify(responseData));
    return responseData;
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

    const overpassQuery = `
      [out:json][timeout:25];
      area[name="${city}"][admin_level~"8|6|4"];
      out center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OverpassResponse = await response.json();
    
    if (data.elements && data.elements.length > 0) {
      const coords = {
        lat: data.elements[0].lat.toString(),
        lon: data.elements[0].lon.toString()
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