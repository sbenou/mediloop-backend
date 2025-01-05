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
    return { results: data };
  } catch (error: any) {
    console.error('Error in searchCity:', error);
    return {
      error: {
        message: 'Failed to search for the city. Please check your internet connection and try again.'
      }
    };
  }
};

export const getCoordinates = async (city: string): Promise<{ lat: string; lon: string } | null> => {
  console.info('Getting coordinates for city:', city);
  
  try {
    const cachedData = sessionStorage.getItem(`coords-${city}`);
    if (cachedData) {
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
      
      // Cache the coordinates in sessionStorage
      sessionStorage.setItem(`coords-${city}`, JSON.stringify(coords));
      return coords;
    }
    return null;
  } catch (error: any) {
    console.error('Error getting coordinates:', error);
    // Try to get from cache even if request fails
    const cachedData = sessionStorage.getItem(`coords-${city}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  }
};