
import { atom } from 'recoil';

// Remove duplicate userAvatarState and use other atoms as needed
export const userImagesState = atom<string[]>({
  key: 'userImagesState',
  default: [],
});

// Doctor images
export const doctorStampUrlState = atom<string | null>({
  key: 'doctorStampUrlState',
  default: null,
});

export const doctorSignatureUrlState = atom<string | null>({
  key: 'doctorSignatureUrlState',
  default: null,
});

// Doctor logo
export const doctorLogoUrlState = atom<string | null>({
  key: 'doctorLogoUrlState',
  default: null,
});

// Pharmacy images
export const pharmacyLogoUrlState = atom<string | null>({
  key: 'pharmacyLogoUrlState',
  default: null,
});

// Pharmacist images
export const pharmacistStampUrlState = atom<string | null>({
  key: 'pharmacistStampUrlState',
  default: null,
});

export const pharmacistSignatureUrlState = atom<string | null>({
  key: 'pharmacistSignatureUrlState',
  default: null,
});

// Testing documentation images
export const documentImageUrlState = atom<string | null>({
  key: 'documentImageUrlState',
  default: null,
});

// Export the userAvatarState from the user/atoms.ts file to maintain imports
export { userAvatarState } from '../user/atoms';
