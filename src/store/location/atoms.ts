
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

// Selected pharmacy state
export const selectedPharmacyState = atom<string | null>({
  key: 'selectedPharmacyState',
  default: null
});
