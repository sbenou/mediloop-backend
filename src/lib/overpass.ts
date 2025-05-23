
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

export const searchDoctors = async (
  lat: number | null, 
  lon: number | null, 
  radius: number = 5000,
  countryCode: string = 'LU'
): Promise<Doctor[]> => {
  console.log(`searchDoctors called with lat: ${lat}, lon: ${lon}, radius: ${radius}, country: ${countryCode}`);
  
  const cacheKey = lat && lon 
    ? `doctors-${countryCode}-${lat}-${lon}-${radius}` 
    : `doctors-${countryCode}`;
    
  const cached = LocalCache.get<Doctor[]>(cacheKey);
  if (cached) {
    console.log(`Returning cached doctors results, count: ${cached.length}`);
    return cached;
  }

  // Choose query based on whether coordinates are provided
  let query;
  
  if (lat && lon) {
    // Coordinate-based query with both radius and country
    query = `
      [out:json][timeout:60];
      // First search within specific radius
      (
        node["healthcare"="doctor"](around:${radius},${lat},${lon});
        node["amenity"="doctors"](around:${radius},${lat},${lon});
        node["healthcare"="clinic"](around:${radius},${lat},${lon});
        node["amenity"="clinic"](around:${radius},${lat},${lon});
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        way["healthcare"="doctor"](around:${radius},${lat},${lon});
        way["amenity"="doctors"](around:${radius},${lat},${lon});
        way["healthcare"="clinic"](around:${radius},${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `;
  } else {
    // Country-only query when no coordinates are provided
    query = `
      [out:json][timeout:60];
      // Search within the country
      area["ISO3166-1"="${countryCode}"][admin_level=2]->.country;
      (
        node["healthcare"="doctor"](area.country);
        node["amenity"="doctors"](area.country);
        node["healthcare"="clinic"](area.country);
        node["amenity"="clinic"](area.country);
        node["amenity"="hospital"](area.country);
        way["healthcare"="doctor"](area.country);
        way["amenity"="doctors"](area.country);
        way["healthcare"="clinic"](area.country);
      );
      out body;
      >;
      out skel qt;
    `;
  }

  console.log('Executing Overpass query for doctors');

  try {
    const data = await fetchFromOverpass(query);
    
    // Verify that the data has the expected structure
    if (!data || !Array.isArray(data.elements)) {
      console.error('Invalid Overpass API response structure for doctors:', data);
      return [];
    }
    
    console.log(`Found ${data.elements.length} raw elements from Overpass API`);
    
    // Process and deduplicate results
    const doctorMap = new Map();
    
    data.elements
      .filter(element => element && typeof element === 'object' && 'id' in element)
      .forEach(element => {
        // Skip if we already processed this element
        if (doctorMap.has(String(element.id))) return;
        
        // Make sure all required properties exist with fallbacks
        const elementLat = typeof element.lat === 'number' ? element.lat : null;
        const elementLon = typeof element.lon === 'number' ? element.lon : null;
        const tags = element.tags || {};
        
        // Only process elements with valid tags that suggest it's a doctor
        const isDoctorOrClinic = 
          tags["healthcare"] === "doctor" || 
          tags["amenity"] === "doctors" ||
          tags["healthcare"] === "clinic" ||
          tags["amenity"] === "clinic" ||
          tags["amenity"] === "hospital";
          
        if (isDoctorOrClinic && (elementLat !== null && elementLon !== null)) {
          // Format address from available address components
          const address = [
            tags['addr:housenumber'],
            tags['addr:street'],
            tags['addr:city'],
            tags['addr:postcode']
          ].filter(Boolean).join(', ') || 'Address not available';
          
          const doctor = {
            id: String(element.id || ''),
            full_name: tags?.name || (tags?.operator || 'Unnamed Doctor'),
            name: tags?.name || (tags?.operator || 'Unnamed Doctor'),
            address,
            city: tags?.['addr:city'] || '',
            license_number: tags?.['healthcare:speciality'] || 'General Practice',
            phone: tags?.['contact:phone'] || tags?.phone || '',
            email: tags?.['contact:email'] || tags?.email || '',
            hours: tags?.opening_hours || '',
            coordinates: {
              lat: elementLat,
              lon: elementLon
            },
            source: 'overpass' as const
          };
          
          doctorMap.set(String(element.id), doctor);
        }
      });

    const results = Array.from(doctorMap.values());
    console.log(`Processed ${results.length} unique doctors with coordinates`);
    
    LocalCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return [];
  }
};
