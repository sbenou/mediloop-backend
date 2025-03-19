
import { atom } from "recoil";

export const doctorStampUrlState = atom<string | null>({
  key: "doctorStampUrlState",
  default: null,
});

export const doctorSignatureUrlState = atom<string | null>({
  key: "doctorSignatureUrlState",
  default: null,
});

export const pharmacyLogoUrlState = atom<string | null>({
  key: "pharmacyLogoUrlState",
  default: null,
});
