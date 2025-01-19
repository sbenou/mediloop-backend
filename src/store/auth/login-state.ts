import { atom } from 'recoil';

interface LoginState {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  email: string | null;
}

export const loginState = atom<LoginState>({
  key: 'loginState',
  default: {
    isLoading: false,
    isError: false,
    isSuccess: false,
    email: null,
  },
});