
import { atom } from "recoil";

export const userLocationState = atom({
  key: 'userLocationState',
  default: { lat: 49.8153, lon: 6.1296 }, // Default to Luxembourg
});
