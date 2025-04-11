
import { selector } from 'recoil';
import { authState } from './atoms';

export const isAuthenticatedSelector = selector({
  key: 'isAuthenticated',
  get: ({ get }) => {
    const auth = get(authState);
    // Consider authenticated if we have a user object
    return !!auth.user;
  },
});

export const userRoleSelector = selector({
  key: 'userRole',
  get: ({ get }) => {
    const auth = get(authState);
    // Return role from profile, or default to 'patient' if authenticated but no role
    return auth.profile?.role || (auth.user ? 'patient' : null);
  },
});

export const userPermissionsSelector = selector({
  key: 'userPermissions',
  get: ({ get }) => {
    const auth = get(authState);
    // Return permissions
    return auth.permissions || [];
  },
});

export const isLoadingSelector = selector({
  key: 'isAuthLoading',
  get: ({ get }) => {
    const auth = get(authState);
    return auth.isLoading;
  },
});

export const isPharmacistSelector = selector({
  key: 'isPharmacist',
  get: ({ get }) => {
    const auth = get(authState);
    return auth.profile?.role === 'pharmacist';
  },
});
