
import { LocalCache } from './cache';
import { calculateDistance } from './utils/distance';
import type { OverpassResult, Pharmacy, Doctor } from './types/overpass.types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const BACKUP_API_URL = 'https://overpass.kumi.systems/api/interpreter';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromOverpass(query: string): Promise<OverpassResult> {
  let retries = MAX_RETRIES;
  let lastError;
  
  while (retries > 0) {
    try {
      const primaryResponse = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      if (!primaryResponse.ok) {
        throw new Error('Primary API failed');
      }

      return await primaryResponse.json();
    } catch (primaryError) {
      console.error(`Primary API error (${retries} retries left):`, primaryError);
      
      try {
        const backupResponse = await fetch(BACKUP_API_URL, {
          method: 'POST',
          body: query,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        });

        if (!backupResponse.ok) {
          throw new Error('Backup API failed');
        }

        return await backupResponse.json();
      } catch (backupError) {
        lastError = backupError;
        retries--;
        if (retries > 0) {
          await delay(RETRY_DELAY);
        }
      }
    }
  }

  throw lastError;
}

export const searchPharmacies = async (lat: number, lon: number, radius: number = 5000): Promise<Pharmacy[]> => {
  const cacheKey = `pharmacies-${lat}-${lon}-${radius}`;
  const cached = LocalCache.get<Pharmacy[]>(cacheKey);
  if (cached) return cached;

  const query = `
    [out:json][timeout:25];
    area["ISO3166-1"="LU"][admin_level=2]->.luxembourg;
    (
      node["amenity"="pharmacy"](area.luxembourg);
      way["amenity"="pharmacy"](area.luxembourg);
      relation["amenity"="pharmacy"](area.luxembourg);
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const data = await fetchFromOverpass(query);
    
    // Verify that the data has the expected structure
    if (!data || !Array.isArray(data.elements)) {
      console.error('Invalid Overpass API response structure for pharmacies:', data);
      return [];
    }
    
    const results = data.elements
      .filter(element => element && typeof element === 'object' && 'id' in element)
      .map(element => {
        // Make sure all required properties exist with fallbacks
        const lat = typeof element.lat === 'number' ? element.lat : null;
        const lon = typeof element.lon === 'number' ? element.lon : null;
        const tags = element.tags || {};
        
        return {
          id: String(element.id || ''),
          name: tags?.name || 'Unnamed Pharmacy',
          address: [
            tags?.['addr:housenumber'],
            tags?.['addr:street'],
            tags?.['addr:city'],
            tags?.['addr:postcode']
          ].filter(Boolean).join(', ') || 'Address not available',
          distance: lat && lon ? calculateDistance(lat, lon, element.lat, element.lon) : 'Unknown',
          hours: tags?.opening_hours || 'Hours not available',
          phone: tags?.['contact:phone'] || '',
          email: tags?.['contact:email'] || tags?.email || '',
          coordinates: {
            lat: lat,
            lon: lon
          }
        };
      })
      .filter(pharmacy => pharmacy.coordinates.lat !== null && pharmacy.coordinates.lon !== null);

    LocalCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Failed to fetch pharmacies:', error);
    return [];
  }
};

export const searchDoctors = async (lat: number, lon: number, radius: number = 5000): Promise<Doctor[]> => {
  const cacheKey = `doctors-${lat}-${lon}-${radius}`;
  const cached = LocalCache.get<Doctor[]>(cacheKey);
  if (cached) return cached;

  const query = `
    [out:json][timeout:25];
    (
      node["healthcare"="doctor"](around:${radius},${lat},${lon});
      node["amenity"="doctors"](around:${radius},${lat},${lon});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const data = await fetchFromOverpass(query);
    
    // Verify that the data has the expected structure
    if (!data || !Array.isArray(data.elements)) {
      console.error('Invalid Overpass API response structure for doctors:', data);
      return [];
    }
    
    const results = data.elements
      .filter(element => element && typeof element === 'object' && 'id' in element)
      .map(element => {
        // Make sure all required properties exist with fallbacks
        const lat = typeof element.lat === 'number' ? element.lat : null;
        const lon = typeof element.lon === 'number' ? element.lon : null;
        const tags = element.tags || {};
        
        return {
          id: String(element.id || ''),
          full_name: tags?.name || 'Unnamed Doctor',
          name: tags?.name || 'Unnamed Doctor',
          address: [
            tags?.['addr:housenumber'],
            tags?.['addr:street'],
            tags?.['addr:city'],
            tags?.['addr:postcode']
          ].filter(Boolean).join(', ') || 'Address not available',
          city: tags?.['addr:city'] || '',
          license_number: tags?.['healthcare:speciality'] || 'General Practice',
          email: tags?.['contact:email'] || tags?.email || '',
          coordinates: {
            lat: lat,
            lon: lon
          }
        };
      })
      .filter(doctor => doctor.coordinates.lat !== null && doctor.coordinates.lon !== null);

    LocalCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return [];
  }
};
