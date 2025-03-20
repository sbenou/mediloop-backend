
import { atom } from 'recoil';

export const userAvatarState = atom<string | null>({
  key: 'userAvatarState',
  default: null,
});
