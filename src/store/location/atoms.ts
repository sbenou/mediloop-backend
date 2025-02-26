
import { atom } from 'recoil';

// Define the location state type
interface Coordinates {
  lat: number;
  lon: number;
}

// Default coordinates (Luxembourg)
const defaultCoordinates: Coordinates = {
  lat: 49.8153,
  lon: 6.1296
};

// User location state atom
export const userLocationState = atom<Coordinates>({
  key: 'userLocationState',
  default: defaultCoordinates
});

// Flag to indicate if user's actual location is being used
export const isUsingLocationState = atom<boolean>({
  key: 'isUsingLocationState',
  default: false
});

// Selected pharmacy state
export const selectedPharmacyState = atom<string | null>({
  key: 'selectedPharmacyState',
  default: null
});
