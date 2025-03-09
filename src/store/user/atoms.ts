
import { atom } from 'recoil';

// Avatar URL Recoil state
export const userAvatarState = atom<string | null>({
  key: 'userAvatarState',
  default: null,
});

// Pharmacy avatar URL Recoil state
export const pharmacyAvatarState = atom<string | null>({
  key: 'pharmacyAvatarState',
  default: null,
});
