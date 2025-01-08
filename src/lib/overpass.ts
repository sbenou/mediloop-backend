interface OverpassResult {
  elements: Array<{
    id: number;
    lat: number;
    lon: number;
    tags: {
      name?: string;
      'addr:street'?: string;
      'addr:housenumber'?: string;
      'addr:postcode'?: string;
      'addr:city'?: string;
      'contact:phone'?: string;
      'contact:email'?: string;
      opening_hours?: string;
      'healthcare'?: string;
      'healthcare:speciality'?: string;
    };
  }>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // Increased to 2 seconds
const BACKUP_API_URL = 'https://overpass.kumi.systems/api/interpreter'; // Backup API endpoint

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const searchPharmacies = async (lat: number, lon: number, radius: number = 5000) => {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="pharmacy"](around:${radius},${lat},${lon});
    );
    out body;
    >;
    out skel qt;
  `;

  let retries = MAX_RETRIES;
  let lastError;
  
  while (retries > 0) {
    try {
      // Try primary API first
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

      const data: OverpassResult = await primaryResponse.json();
      return data.elements.map(element => ({
        id: element.id.toString(),
        name: element.tags.name || 'Unnamed Pharmacy',
        address: [
          element.tags['addr:housenumber'],
          element.tags['addr:street'],
          element.tags['addr:city'],
          element.tags['addr:postcode']
        ].filter(Boolean).join(', '),
        distance: calculateDistance(lat, lon, element.lat, element.lon),
        hours: element.tags.opening_hours || 'Hours not available',
        phone: element.tags['contact:phone'] || undefined,
        email: element.tags['contact:email'] || undefined,
        coordinates: {
          lat: element.lat,
          lon: element.lon
        }
      }));
    } catch (primaryError) {
      console.error(`Primary API error (${retries} retries left):`, primaryError);
      
      try {
        // Try backup API
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

        const data: OverpassResult = await backupResponse.json();
        return data.elements.map(element => ({
          id: element.id.toString(),
          name: element.tags.name || 'Unnamed Pharmacy',
          address: [
            element.tags['addr:housenumber'],
            element.tags['addr:street'],
            element.tags['addr:city'],
            element.tags['addr:postcode']
          ].filter(Boolean).join(', '),
          distance: calculateDistance(lat, lon, element.lat, element.lon),
          hours: element.tags.opening_hours || 'Hours not available',
          phone: element.tags['contact:phone'] || undefined,
          email: element.tags['contact:email'] || undefined,
          coordinates: {
            lat: element.lat,
            lon: element.lon
          }
        }));
      } catch (backupError) {
        lastError = backupError;
        retries--;
        if (retries > 0) {
          await delay(RETRY_DELAY);
        }
      }
    }
  }

  console.error('All API attempts failed:', lastError);
  return [];
};

export const searchDoctors = async (lat: number, lon: number, radius: number = 5000) => {
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

  let retries = MAX_RETRIES;
  let lastError;
  
  while (retries > 0) {
    try {
      // Try primary API first
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

      const data: OverpassResult = await primaryResponse.json();
      return data.elements.map(element => ({
        id: element.id.toString(),
        full_name: element.tags.name || 'Unnamed Doctor',
        address: [
          element.tags['addr:housenumber'],
          element.tags['addr:street'],
          element.tags['addr:city'],
          element.tags['addr:postcode']
        ].filter(Boolean).join(', '),
        city: element.tags['addr:city'] || '',
        license_number: element.tags['healthcare:speciality'] || 'General Practice',
        email: element.tags['contact:email'] || element.tags['email'] || undefined,
        coordinates: {
          lat: element.lat,
          lon: element.lon
        }
      }));
    } catch (primaryError) {
      console.error(`Primary API error (${retries} retries left):`, primaryError);
      
      try {
        // Try backup API
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

        const data: OverpassResult = await backupResponse.json();
        return data.elements.map(element => ({
          id: element.id.toString(),
          full_name: element.tags.name || 'Unnamed Doctor',
          address: [
            element.tags['addr:housenumber'],
            element.tags['addr:street'],
            element.tags['addr:city'],
            element.tags['addr:postcode']
          ].filter(Boolean).join(', '),
          city: element.tags['addr:city'] || '',
          license_number: element.tags['healthcare:speciality'] || 'General Practice',
          email: element.tags['contact:email'] || element.tags['email'] || undefined,
          coordinates: {
            lat: element.lat,
            lon: element.lon
          }
        }));
      } catch (backupError) {
        lastError = backupError;
        retries--;
        if (retries > 0) {
          await delay(RETRY_DELAY);
        }
      }
    }
  }

  console.error('All API attempts failed:', lastError);
  return [];
};

// Haversine formula for calculating distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  
  if (d < 1) {
    return `${Math.round(d * 1000)} meters`;
  }
  return `${d.toFixed(1)} km`;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}