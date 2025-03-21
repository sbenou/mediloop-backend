
import { atom } from 'recoil';

// Avatar URL Recoil state
export const userAvatarState = atom<string | null>({
  key: 'userAvatarState',
  default: null,
});
