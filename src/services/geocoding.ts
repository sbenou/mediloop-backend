interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: {
    name: string;
    place?: string;
  };
  center?: {
    lat: number;
    lon: number;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface NominatimResult {
  place_id: number;
  display_name: string;
}

export const searchCity = async (query: string) => {
  try {
    // Use Nominatim API instead of Overpass for city search
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
      {
        headers: {
          'User-Agent': 'Lovable Health App'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch cities');
    }

    const data: NominatimResult[] = await response.json();
    return data.map(result => ({
      place_id: result.place_id,
      display_name: result.display_name
    }));
  } catch (error) {
    console.error('Error searching city:', error);
    return [];
  }
};

export const getCoordinates = async (city: string): Promise<{ lat: string; lon: string } | null> => {
  console.log('Searching coordinates for city:', city);
  
  try {
    // Use Nominatim API for coordinates
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'Lovable Health App'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch coordinates');
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const coords = {
        lat: data[0].lat.toString(),
        lon: data[0].lon.toString()
      };
      // Cache the coordinates
      sessionStorage.setItem(`coords-${city}`, JSON.stringify(coords));
      return coords;
    }

    // Check cached coordinates if API fails
    const cachedCoords = sessionStorage.getItem(`coords-${city}`);
    if (cachedCoords) {
      return JSON.parse(cachedCoords);
    }

    console.log('No coordinates found for city:', city);
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    
    // Try cached coordinates as fallback
    const cachedCoords = sessionStorage.getItem(`coords-${city}`);
    if (cachedCoords) {
      return JSON.parse(cachedCoords);
    }
    
    return null;
  }
};