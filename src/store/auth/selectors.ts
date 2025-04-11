
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
    // Return role from profile as highest priority source of truth
    // Always convert 'user' to 'patient' as we've migrated away from 'user' role
    const profileRole = auth.profile?.role;
    
    if (!profileRole && auth.user) {
      return 'patient';
    }
    
    return profileRole === 'user' ? 'patient' : profileRole || null;
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
    // Be explicit about checking for 'pharmacist' role
    return auth.profile?.role === 'pharmacist';
  },
});
