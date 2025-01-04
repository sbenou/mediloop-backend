const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

interface GeocodingResult {
  display_name: string;
  place_id: number;
  lat?: string;
  lon?: string;
}

export const searchCity = async (query: string): Promise<GeocodingResult[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5&featuretype=city`,
      {
        headers: {
          'User-Agent': 'Lovable Health App (development)',
          'Accept-Language': 'en'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Geocoding error:', error);
    throw error;
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
    throw error;
  }
};