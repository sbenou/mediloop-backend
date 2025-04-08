
import { atom } from 'recoil';

// Avatar URL Recoil state - ensure this is the only definition in the codebase
export const userAvatarState = atom<string | null>({
  key: 'userAvatarState',
  default: null,
});
