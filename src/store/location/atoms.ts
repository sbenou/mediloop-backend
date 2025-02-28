
import { atom } from 'recoil';

// Default coordinates for Luxembourg
export const LUXEMBOURG_COORDINATES = { lat: 49.8153, lon: 6.1296 };

export const userLocationState = atom<{ lat: number; lon: number } | null>({
  key: 'userLocationState',
  default: LUXEMBOURG_COORDINATES
});

export const isUsingLocationState = atom<boolean>({
  key: 'isUsingLocationState',
  default: false
});
