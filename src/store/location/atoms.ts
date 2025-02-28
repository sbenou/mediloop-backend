
import { atom } from 'recoil';
import { LUXEMBOURG_COORDINATES } from '@/hooks/usePharmacyState';

export const userLocationState = atom<{ lat: number; lon: number } | null>({
  key: 'userLocationState',
  default: LUXEMBOURG_COORDINATES
});

export const isUsingLocationState = atom<boolean>({
  key: 'isUsingLocationState',
  default: false
});
