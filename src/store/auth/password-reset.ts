import { atom } from 'recoil';

interface PasswordResetState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  email: string | null;
}

export const passwordResetState = atom<PasswordResetState>({
  key: 'passwordResetState',
  default: {
    isLoading: false,
    isSuccess: false,
    isError: false,
    email: null,
  },
});