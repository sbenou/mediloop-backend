
import { atom } from "recoil";

// User avatar
export const userAvatarState = atom({
  key: "userAvatarState",
  default: null as string | null,
});

// Doctor images
export const doctorStampUrlState = atom({
  key: "doctorStampUrlState",
  default: null as string | null,
});

export const doctorSignatureUrlState = atom({
  key: "doctorSignatureUrlState",
  default: null as string | null,
});

// Doctor logo
export const doctorLogoUrlState = atom({
  key: "doctorLogoUrlState",
  default: null as string | null,
});

// Pharmacy images
export const pharmacyLogoUrlState = atom({
  key: "pharmacyLogoUrlState",
  default: null as string | null,
});

// Pharmacist images
export const pharmacistStampUrlState = atom({
  key: "pharmacistStampUrlState",
  default: null as string | null,
});

export const pharmacistSignatureUrlState = atom({
  key: "pharmacistSignatureUrlState",
  default: null as string | null,
});

// Testing documentation images
export const documentImageUrlState = atom({
  key: "documentImageUrlState",
  default: null as string | null,
});
