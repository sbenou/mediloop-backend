export interface OverpassResult {
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

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
}

export interface Pharmacy extends Location {
  distance: string;
  hours: string;
  phone?: string;
  email?: string;
}

export interface Doctor extends Location {
  full_name: string;
  city: string;
  license_number: string;
  email?: string;
}