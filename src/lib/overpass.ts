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
      opening_hours?: string;
      'healthcare'?: string;
      'healthcare:speciality'?: string;
    };
  }>;
}

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

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch pharmacies');
  }

  const data: OverpassResult = await response.json();
  
  return data.elements.map(element => ({
    id: element.id,
    name: element.tags.name || 'Unnamed Pharmacy',
    address: [
      element.tags['addr:housenumber'],
      element.tags['addr:street'],
      element.tags['addr:city'],
      element.tags['addr:postcode']
    ].filter(Boolean).join(', '),
    distance: calculateDistance(lat, lon, element.lat, element.lon),
    hours: element.tags.opening_hours || 'Hours not available',
    phone: element.tags['contact:phone'] || 'Phone not available',
    coordinates: {
      lat: element.lat,
      lon: element.lon
    }
  }));
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

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch doctors');
  }

  const data: OverpassResult = await response.json();
  
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
    coordinates: {
      lat: element.lat,
      lon: element.lon
    }
  }));
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