
import { selector } from 'recoil';
import { authState } from './atoms';

export const isAuthenticatedSelector = selector({
  key: 'isAuthenticated',
  get: ({ get }) => {
    const auth = get(authState);
    // Consider authenticated if we have both user and profile
    return !!auth.user && !!auth.profile;
  },
});

export const userRoleSelector = selector({
  key: 'userRole',
  get: ({ get }) => {
    const auth = get(authState);
    const r = auth.profile?.role;
    if (r == null || r === '') return null;
    return String(r).toLowerCase();
  },
});

export const userPermissionsSelector = selector({
  key: 'userPermissions',
  get: ({ get }) => {
    const auth = get(authState);
    // Return permissions even during loading if we have them
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
    const profileRole = auth.profile?.role;
    
    // Improved check that's more forgiving with string types and handles case insensitivity properly
    if (!profileRole) {
      return false;
    }
    
    // Enhanced check with detailed logging
    const normalizedRole = String(profileRole).toLowerCase();
    const result = normalizedRole === 'pharmacist';
    
    console.log("[isPharmacistSelector] Check result:", { 
      profileRole, 
      normalizedRole,
      result,
      typeOfRole: typeof profileRole
    });
    
    return result;
  },
});
