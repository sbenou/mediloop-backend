
import { LocalCache } from './cache';
import { calculateDistance } from './utils/distance';
import { supabase } from './supabase';
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
    
    if (!data || !Array.isArray(data.elements)) {
      console.error('Invalid Overpass API response structure for pharmacies:', data);
      return [];
    }
    
    const results = data.elements
      .filter(element => element && typeof element === 'object' && 'id' in element)
      .map(element => {
        const lat = typeof element.lat === 'number' ? element.lat : null;
        const lon = typeof element.lon === 'number' ? element.lon : null;
        const tags = element.tags || {};
        
        const pharmacy = {
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

        // Store pharmacy hours in metadata table if we have hours data
        if (tags?.opening_hours && pharmacy.name !== 'Unnamed Pharmacy') {
          storePharmacyMetadata(pharmacy.name, pharmacy.address, tags.opening_hours).catch(err => {
            console.error('Error storing pharmacy metadata:', err);
          });
        }

        return pharmacy;
      })
      .filter(pharmacy => pharmacy.coordinates.lat !== null && pharmacy.coordinates.lon !== null);

    LocalCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Failed to fetch pharmacies:', error);
    return [];
  }
};

// Helper function to store pharmacy metadata
async function storePharmacyMetadata(name: string, address: string, hours: string) {
  try {
    // First, try to find an existing pharmacy with this name and address
    const { data: existingPharmacy } = await supabase
      .from('pharmacies')
      .select('id')
      .eq('name', name)
      .eq('address', address)
      .maybeSingle();

    if (existingPharmacy) {
      // Update or create pharmacy_metadata entry
      await supabase
        .from('pharmacy_metadata')
        .upsert({
          pharmacy_id: existingPharmacy.id,
          logo_url: null
        });

      // Update pharmacy hours in the main table
      await supabase
        .from('pharmacies')
        .update({ hours })
        .eq('id', existingPharmacy.id);
    }
  } catch (error) {
    console.error('Error in storePharmacyMetadata:', error);
  }
}

// Helper function to store doctor metadata
async function storeDoctorMetadata(doctorId: string, hours: string, address: string, city: string) {
  try {
    await supabase
      .from('doctor_metadata')
      .upsert({
        doctor_id: doctorId,
        hours,
        address,
        city,
        postal_code: ''
      });
  } catch (error) {
    console.error('Error in storeDoctorMetadata:', error);
  }
}

export const searchDoctors = async (
  lat: number | null, 
  lon: number | null, 
  radius: number = 5000,
  countryCode: string = 'LU'
): Promise<Doctor[]> => {
  console.log(`searchDoctors called with lat: ${lat}, lon: ${lon}, radius: ${radius}, country: ${countryCode}`);
  
  const cacheKey = lat && lon 
    ? `doctors-${countryCode}-${lat}-${lon}-${radius}` 
    : `doctors-country-${countryCode}`;
    
  const cached = LocalCache.get<Doctor[]>(cacheKey);
  if (cached) {
    console.log(`Returning cached doctors results, count: ${cached.length}`);
    return cached;
  }

  let query;
  
  if (lat && lon) {
    // More focused query similar to pharmacy search - prioritize named medical facilities
    query = `
      [out:json][timeout:60];
      (
        node["amenity"="doctors"][name](around:${radius},${lat},${lon});
        node["healthcare"="doctor"][name](around:${radius},${lat},${lon});
        node["amenity"="clinic"][name](around:${radius},${lat},${lon});
        node["healthcare"="clinic"][name](around:${radius},${lat},${lon});
        node["amenity"="hospital"][name](around:${radius},${lat},${lon});
        way["amenity"="doctors"][name](around:${radius},${lat},${lon});
        way["healthcare"="doctor"][name](around:${radius},${lat},${lon});
        way["amenity"="clinic"][name](around:${radius},${lat},${lon});
        way["healthcare"="clinic"][name](around:${radius},${lat},${lon});
        way["amenity"="hospital"][name](around:${radius},${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `;
  } else {
    query = `
      [out:json][timeout:60];
      area["ISO3166-1"="${countryCode}"][admin_level=2]->.country;
      (
        node["amenity"="doctors"][name](area.country);
        node["healthcare"="doctor"][name](area.country);
        node["amenity"="clinic"][name](area.country);
        node["healthcare"="clinic"][name](area.country);
        node["amenity"="hospital"][name](area.country);
        way["amenity"="doctors"][name](area.country);
        way["healthcare"="doctor"][name](area.country);
        way["amenity"="clinic"][name](area.country);
        way["healthcare"="clinic"][name](area.country);
        way["amenity"="hospital"][name](area.country);
      );
      out body;
      >;
      out skel qt;
    `;
  }

  console.log('Executing Overpass query for doctors...');

  try {
    const data = await fetchFromOverpass(query);
    
    if (!data || !Array.isArray(data.elements)) {
      console.error('Invalid Overpass API response structure for doctors:', data);
      return [];
    }
    
    console.log(`Found ${data.elements.length} raw elements from Overpass API`);
    
    const doctorMap = new Map();
    
    data.elements
      .filter(element => element && typeof element === 'object' && 'id' in element)
      .forEach(element => {
        if (doctorMap.has(String(element.id))) return;
        
        const elementLat = typeof element.lat === 'number' ? element.lat : null;
        const elementLon = typeof element.lon === 'number' ? element.lon : null;
        const tags = element.tags || {};
        
        // Only include entries that have a name - this filters out generic "Medical Facility" entries
        const hasValidName = tags.name && tags.name.trim() !== '';
        
        const isMedicalFacility = 
          tags["healthcare"] === "doctor" || 
          tags["amenity"] === "doctors" ||
          tags["healthcare"] === "clinic" ||
          tags["amenity"] === "clinic" ||
          tags["amenity"] === "hospital";
          
        if (hasValidName && isMedicalFacility && (elementLat !== null && elementLon !== null)) {
          // Build address more comprehensively
          const addressParts = [];
          if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
          if (tags['addr:street']) addressParts.push(tags['addr:street']);
          if (tags['addr:city']) addressParts.push(tags['addr:city']);
          if (tags['addr:postcode']) addressParts.push(tags['addr:postcode']);
          
          // If no structured address, try other address fields
          let address = addressParts.length > 0 ? addressParts.join(', ') : '';
          if (!address && tags.address) {
            address = tags.address;
          }
          if (!address) {
            address = `${tags['addr:city'] || 'Luxembourg'}`;
          }
          
          let distance = undefined;
          if (lat !== null && lon !== null) {
            distance = calculateDistance(lat, lon, elementLat, elementLon);
            if (typeof distance === 'number') {
              distance = parseFloat(distance.toFixed(1));
            }
          }
          
          const doctorId = String(element.id || '');
          const hours = tags?.opening_hours || '';
          const city = tags?.['addr:city'] || '';
          
          // Get speciality information for license_number field
          let speciality = 'General Practice';
          if (tags['healthcare:speciality']) {
            speciality = tags['healthcare:speciality']
              .split(';')
              .map((s: string) => s.trim())
              .join(', ');
          }
          
          const doctor = {
            id: doctorId,
            full_name: tags.name,
            name: tags.name,
            address,
            city: city || 'Luxembourg',
            license_number: speciality,
            phone: tags?.['contact:phone'] || tags?.phone || '',
            email: tags?.['contact:email'] || tags?.email || '',
            hours,
            coordinates: {
              lat: elementLat,
              lon: elementLon
            },
            distance,
            source: 'overpass' as const
          };
          
          console.log(`Adding doctor: ${doctor.full_name} at ${address}`);
          
          // Store doctor metadata if we have hours data
          if (hours && doctor.full_name) {
            storeDoctorMetadata(doctorId, hours, address, city).catch(err => {
              console.error('Error storing doctor metadata:', err);
            });
          }
          
          doctorMap.set(String(element.id), doctor);
        } else {
          console.log(`Skipping entry - hasValidName: ${hasValidName}, isMedicalFacility: ${isMedicalFacility}, hasCoords: ${elementLat !== null && elementLon !== null}`);
        }
      });

    const results = Array.from(doctorMap.values());
    console.log(`Processed ${results.length} valid doctors with names and addresses`);
    
    LocalCache.set(cacheKey, results, 300);
    return results;
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return [];
  }
};
