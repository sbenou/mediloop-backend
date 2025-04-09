
import { atom } from 'recoil';

// User avatar state
export const userAvatarState = atom({
  key: 'userAvatarState_v1', // Updated key to prevent duplicates
  default: null as string | null,
});

// Pharmacy logo state
export const pharmacyLogoState = atom({
  key: 'pharmacyLogoState_v1', // Updated key to prevent duplicates
  default: null as string | null,
});
