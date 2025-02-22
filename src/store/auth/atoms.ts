
import { atom } from 'recoil';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/user';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  permissions: string[];
}

export const authState = atom<AuthState>({
  key: 'authState',
  default: {
    user: null,
    profile: null,
    isLoading: true,
    permissions: [],
  },
});
