import { toast } from "@/components/ui/use-toast";

interface OverpassResponse {
  elements: Array<{
    id: number;
    lat?: number;
    lon?: number;
    tags?: {
      name?: string;
      'addr:city'?: string;
    };
    center?: {
      lat: number;
      lon: number;
    };
  }>;
}

export const getCoordinates = async (city: string): Promise<{ lat: string; lon: string } | null> => {
  console.log('Searching coordinates for city:', city);
  
  try {
    // Check cache first
    const cachedData = sessionStorage.getItem(`coords-${city}`);
    if (cachedData) {
      console.log('Using cached coordinates for:', city);
      return JSON.parse(cachedData);
    }

    const query = `
      [out:json][timeout:25];
      area[name="${city}"][admin_level~"8|6|4"];
      out center;
      
      // Also search for nodes with the city name as a fallback
      node[place~"city|town|village"]["name"="${city}"];
      out center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OverpassResponse = await response.json();
    console.log('Overpass API response:', data);

    let coordinates = null;

    // Try to get coordinates from the first result
    if (data.elements && data.elements.length > 0) {
      const element = data.elements[0];
      
      // Check for direct lat/lon
      if (element.lat && element.lon) {
        coordinates = {
          lat: element.lat.toString(),
          lon: element.lon.toString()
        };
      }
      // Check for center coordinates
      else if (element.center) {
        coordinates = {
          lat: element.center.lat.toString(),
          lon: element.center.lon.toString()
        };
      }
    }

    if (coordinates) {
      console.log('Found coordinates:', coordinates);
      // Cache the successful coordinates
      sessionStorage.setItem(`coords-${city}`, JSON.stringify(coordinates));
      return coordinates;
    }

    console.log('No coordinates found for city:', city);
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    
    // Try to get from cache on error
    const cachedData = sessionStorage.getItem(`coords-${city}`);
    if (cachedData) {
      console.log('Using cached coordinates after error');
      return JSON.parse(cachedData);
    }
    
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to get location coordinates. Please try again.",
    });
    
    return null;
  }
};

export const searchCity = async (query: string) => {
  try {
    const overpassQuery = `
      [out:json][timeout:25];
      (
        area[name~"${query}",i][admin_level~"8|6|4"];
        node[place~"city|town|village"][name~"${query}",i];
      );
      out body;
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
    
    return data.elements.map(element => ({
      place_id: element.id,
      display_name: element.tags?.name || query,
    }));
  } catch (error) {
    console.error('Error searching city:', error);
    return [];
  }
};