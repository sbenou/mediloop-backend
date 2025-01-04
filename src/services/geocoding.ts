const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

interface GeocodingResult {
  display_name: string;
  place_id: number;
  lat?: string;
  lon?: string;
}

export const searchCity = async (query: string): Promise<GeocodingResult[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased timeout to 10 seconds

  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5&featuretype=city`,
      {
        headers: {
          'User-Agent': 'MediHop Health App (development)',
          'Accept-Language': 'en'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('Request timed out:', error);
      return []; // Return empty array instead of throwing
    }
    console.error('Geocoding error:', error);
    return []; // Return empty array for other errors too
  }
};

export const getCoordinates = async (city: string): Promise<{ lat: string; lon: string } | null> => {
  try {
    const results = await searchCity(city);
    if (results.length > 0 && results[0].lat && results[0].lon) {
      return {
        lat: results[0].lat,
        lon: results[0].lon
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
};