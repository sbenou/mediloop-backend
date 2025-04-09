
import { atom } from 'recoil';

export const userAvatarState = atom({
  key: 'userAvatarState',
  default: null as string | null,
});

export const pharmacyLogoState = atom({
  key: 'pharmacyLogoState',
  default: null as string | null,
});
