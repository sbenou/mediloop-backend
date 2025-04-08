
import { atom } from 'recoil';

// Remove duplicate userAvatarState and use other atoms as needed
export const userImagesState = atom<string[]>({
  key: 'userImagesState',
  default: [],
});

// Export the userAvatarState from the user/atoms.ts file to maintain imports
export { userAvatarState } from '../user/atoms';
