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

export const getCoordinates = async (city: string): Promise<{ lat: string; lon: string } | null> => {
  console.log('Searching coordinates for city:', city);
  
  try {
    const query = `
      [out:json][timeout:25];
      (
        area["name"="${city}"][admin_level~"8|6|4"];
        node["place"~"city|town|village"]["name"="${city}"];
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch coordinates');
    }

    const data: OverpassResponse = await response.json();
    console.log('Overpass API response:', data);

    // First try to find a node with coordinates
    const nodeWithCoords = data.elements.find(
      element => element.type === 'node' && element.lat && element.lon
    );

    if (nodeWithCoords && nodeWithCoords.lat && nodeWithCoords.lon) {
      const coords = {
        lat: nodeWithCoords.lat.toString(),
        lon: nodeWithCoords.lon.toString()
      };
      // Cache the coordinates
      sessionStorage.setItem(`coords-${city}`, JSON.stringify(coords));
      return coords;
    }

    // If no direct coordinates found, try to find an area with a center
    const areaWithCenter = data.elements.find(
      element => element.type === 'area' && element.center?.lat && element.center?.lon
    );

    if (areaWithCenter?.center) {
      const coords = {
        lat: areaWithCenter.center.lat.toString(),
        lon: areaWithCenter.center.lon.toString()
      };
      // Cache the coordinates
      sessionStorage.setItem(`coords-${city}`, JSON.stringify(coords));
      return coords;
    }

    console.log('No coordinates found for city:', city);
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
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
      throw new Error('Failed to fetch cities');
    }

    const data: OverpassResponse = await response.json();
    
    return data.elements
      .filter(element => element.tags?.name)
      .map(element => ({
        place_id: element.id,
        display_name: element.tags!.name
      }));
  } catch (error) {
    console.error('Error searching city:', error);
    return [];
  }
};