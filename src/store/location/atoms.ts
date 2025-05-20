
import { atom } from 'recoil';

// Default coordinates (Luxembourg City)
const DEFAULT_COORDINATES = { lat: 49.8153, lon: 6.1296 };

// User's current location
export const userLocationState = atom({
  key: 'userLocationState',
  default: DEFAULT_COORDINATES
});

// Whether the user has chosen to use their location
export const isUsingLocationState = atom({
  key: 'isUsingLocationState',
  default: false
});

// Selected country code (ISO 3166-1 alpha-2)
export const selectedCountryState = atom({
  key: 'selectedCountryState',
  default: 'LU' // Default to Luxembourg
});
