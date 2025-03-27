
import { atom } from "recoil";

// Doctor images
export const doctorStampUrlState = atom<string | null>({
  key: 'doctorStampUrlState',
  default: null,
});

export const doctorSignatureUrlState = atom<string | null>({
  key: 'doctorSignatureUrlState',
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
